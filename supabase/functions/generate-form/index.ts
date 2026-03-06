import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  formType: 'agency' | 'customer';
  websiteUrl?: string;
  businessContext?: string;
  userId: string;
}

interface Question {
  question_text: string;
  question_type: 'text' | 'textarea' | 'select' | 'email' | 'phone' | 'number';
  is_required: boolean;
  options?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY');

    console.log('OpenRouter API Key exists:', !!openrouterKey);
    console.log('OpenRouter API Key length:', openrouterKey?.length);

    if (!openrouterKey) {
      throw new Error('OPENROUTER_API_KEY is not configured. Please set it in your environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const body: RequestBody = await req.json();
    const { formType, websiteUrl, businessContext, userId } = body;

    let businessInfo = '';
    let formTitle = '';
    let formDescription = '';

    // Step 1: Research the business using GPT-4o-mini with web search
    if (openrouterKey && websiteUrl) {
      try {
        const researchPrompt = `Research this business website: ${websiteUrl}

Please provide:
1. What industry/niche they operate in
2. What services or products they offer
3. Who their target customers are
4. Their unique value proposition
5. Key information that would be relevant for onboarding new clients

Be specific and detailed based on what you find about their business.`;

        const researchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': websiteUrl,
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
              { role: 'user', content: researchPrompt },
            ],
            temperature: 0.5,
          }),
        });

        if (!researchResponse.ok) {
          throw new Error(`Research API error: ${researchResponse.status}`);
        }

        const researchData = await researchResponse.json();
        businessInfo = researchData.choices[0].message.content;
        console.log('Business research completed:', businessInfo.slice(0, 200));
      } catch (error) {
        console.error('Error researching business:', error);
        businessInfo = `Business website: ${websiteUrl}`;
      }
    } else if (businessContext) {
      businessInfo = businessContext;
    }

    let questions: Question[] = [];

    // Step 2: Generate form questions using Gemini Flash based on research
    if (openrouterKey && businessInfo) {
      const formPrompt = formType === 'agency'
        ? `You are an expert at creating client onboarding forms for businesses and agencies.

Based on this business research:
${businessInfo}

Create a comprehensive client onboarding form with 8-12 highly relevant questions. The questions should:
- Be specific to this business's industry and services
- Help understand the client's needs, goals, budget, timeline, and preferences
- Include both required basic info (name, email, company) and industry-specific questions
- Use appropriate question types (text, textarea, email, phone, select, number)

Return ONLY a valid JSON object with this structure:
{
  "title": "Clear, specific form title for this business",
  "description": "Brief description that reflects this business",
  "questions": [
    {
      "question_text": "Question text here",
      "question_type": "text|textarea|email|phone|select|number",
      "is_required": true|false,
      "options": ["option1", "option2"] (only for select type)
    }
  ]
}

Make questions highly specific to this business's services and industry. Avoid generic questions.`
        : `You are an expert at creating customer intake forms for businesses.

Based on this business description:
${businessInfo}

Create a reusable customer intake form with 8-12 questions. The questions should:
- Collect essential customer information
- Understand their needs and project details
- Be specific to this business's services
- Include budget and timeline questions

Return ONLY a valid JSON object with this structure:
{
  "title": "Clear form title",
  "description": "Brief description",
  "questions": [
    {
      "question_text": "Question text here",
      "question_type": "text|textarea|email|phone|select|number",
      "is_required": true|false,
      "options": ["option1", "option2"] (only for select type)
    }
  ]
}

Make questions relevant to the business's services.`;

      try {
        const formResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp:free',
            messages: [
              { role: 'user', content: formPrompt },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }),
        });

        if (!formResponse.ok) {
          throw new Error(`Form generation API error: ${formResponse.status}`);
        }

        const formData = await formResponse.json();
        const content = formData.choices[0].message.content;
        const parsedContent = JSON.parse(content);

        formTitle = parsedContent.title;
        formDescription = parsedContent.description;
        questions = parsedContent.questions;

        console.log(`Generated ${questions.length} questions for ${formType} form`);
      } catch (error) {
        console.error('AI form generation error:', error);
        questions = getDefaultQuestions(formType);
        formTitle = formType === 'agency' ? 'Client Onboarding Form' : 'Customer Intake Form';
        formDescription = 'Please fill out this form to help us understand your needs better.';
      }
    } else {
      questions = getDefaultQuestions(formType);
      formTitle = formType === 'agency' ? 'Client Onboarding Form' : 'Customer Intake Form';
      formDescription = 'Please fill out this form to help us understand your needs better.';
    }

    const { data: form, error: formError } = await supabase
      .from('forms')
      .insert({
        owner_id: userId,
        form_type: formType,
        title: formTitle,
        description: formDescription,
        website_url: websiteUrl || null,
        business_context: businessContext || null,
        is_published: false,
      })
      .select()
      .single();

    if (formError) throw formError;

    const questionsToInsert = questions.map((q, index) => ({
      form_id: form.id,
      question_text: q.question_text,
      question_type: q.question_type,
      is_required: q.is_required,
      order_index: index,
      options: q.options ? JSON.stringify(q.options) : null,
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

    return new Response(
      JSON.stringify({ formId: form.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getDefaultQuestions(formType: 'agency' | 'customer'): Question[] {
  if (formType === 'agency') {
    return [
      { question_text: 'What is your full name?', question_type: 'text', is_required: true },
      { question_text: 'What is your email address?', question_type: 'email', is_required: true },
      { question_text: 'What is your company name?', question_type: 'text', is_required: true },
      { question_text: 'What is your phone number?', question_type: 'phone', is_required: false },
      { question_text: 'What are your main business goals?', question_type: 'textarea', is_required: true },
      { question_text: 'Who is your target audience?', question_type: 'textarea', is_required: true },
      { question_text: 'What is your estimated budget?', question_type: 'select', is_required: true, options: ['Less than $5,000', '$5,000 - $10,000', '$10,000 - $25,000', '$25,000 - $50,000', '$50,000+'] },
      { question_text: 'What is your desired timeline?', question_type: 'select', is_required: true, options: ['ASAP', '1-2 months', '3-6 months', '6+ months', 'Flexible'] },
      { question_text: 'Do you have any existing brand guidelines?', question_type: 'select', is_required: true, options: ['Yes', 'No', 'Partial'] },
      { question_text: 'Who are your main competitors?', question_type: 'textarea', is_required: false },
      { question_text: 'What makes your business unique?', question_type: 'textarea', is_required: true },
      { question_text: 'Any additional information or special requirements?', question_type: 'textarea', is_required: false },
    ];
  } else {
    return [
      { question_text: 'What is your full name?', question_type: 'text', is_required: true },
      { question_text: 'What is your email address?', question_type: 'email', is_required: true },
      { question_text: 'What is your phone number?', question_type: 'phone', is_required: false },
      { question_text: 'What service are you interested in?', question_type: 'textarea', is_required: true },
      { question_text: 'Please describe your project or needs', question_type: 'textarea', is_required: true },
      { question_text: 'What is your budget range?', question_type: 'select', is_required: true, options: ['Less than $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+'] },
      { question_text: 'When do you need this completed?', question_type: 'select', is_required: true, options: ['Within 1 week', '1-2 weeks', '2-4 weeks', '1-2 months', 'Flexible'] },
      { question_text: 'How did you hear about us?', question_type: 'select', is_required: false, options: ['Google Search', 'Social Media', 'Referral', 'Advertisement', 'Other'] },
      { question_text: 'Any additional details or questions?', question_type: 'textarea', is_required: false },
    ];
  }
}
