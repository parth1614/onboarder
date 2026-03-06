/*
  # OnboardAI Database Schema

  1. New Tables
    - `forms`
      - `id` (uuid, primary key)
      - `owner_id` (uuid, references auth.users)
      - `form_type` (text, 'agency' or 'customer')
      - `title` (text)
      - `description` (text)
      - `website_url` (text, nullable)
      - `business_context` (text, nullable)
      - `is_published` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `questions`
      - `id` (uuid, primary key)
      - `form_id` (uuid, references forms)
      - `question_text` (text)
      - `question_type` (text: 'text', 'textarea', 'select', 'multiselect', 'file', 'email', 'phone')
      - `options` (jsonb, nullable for select/multiselect types)
      - `is_required` (boolean)
      - `order_index` (integer)
      - `created_at` (timestamptz)
    
    - `responses`
      - `id` (uuid, primary key)
      - `form_id` (uuid, references forms)
      - `submitted_at` (timestamptz)
      - `respondent_email` (text, nullable)
    
    - `answers`
      - `id` (uuid, primary key)
      - `response_id` (uuid, references responses)
      - `question_id` (uuid, references questions)
      - `answer_text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Forms: Users can CRUD their own forms
    - Questions: Users can CRUD questions for their forms
    - Responses: Anyone can insert, owners can read their form responses
    - Answers: Anyone can insert, owners can read answers for their form responses
*/

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  form_type text NOT NULL CHECK (form_type IN ('agency', 'customer')),
  title text NOT NULL,
  description text DEFAULT '',
  website_url text,
  business_context text,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'textarea', 'select', 'multiselect', 'file', 'email', 'phone', 'number')),
  options jsonb,
  is_required boolean DEFAULT true,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create responses table
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  respondent_email text
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES responses(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Forms policies
CREATE POLICY "Users can view own forms"
  ON forms FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create own forms"
  ON forms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own forms"
  ON forms FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete own forms"
  ON forms FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Questions policies
CREATE POLICY "Users can view questions for their forms"
  ON questions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = questions.form_id
    AND forms.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can view questions for published forms"
  ON questions FOR SELECT
  TO anon
  USING (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = questions.form_id
    AND forms.is_published = true
  ));

CREATE POLICY "Users can create questions for their forms"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = questions.form_id
    AND forms.owner_id = auth.uid()
  ));

CREATE POLICY "Users can update questions for their forms"
  ON questions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = questions.form_id
    AND forms.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = questions.form_id
    AND forms.owner_id = auth.uid()
  ));

CREATE POLICY "Users can delete questions for their forms"
  ON questions FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = questions.form_id
    AND forms.owner_id = auth.uid()
  ));

-- Responses policies
CREATE POLICY "Anyone can submit responses to published forms"
  ON responses FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = responses.form_id
    AND forms.is_published = true
  ));

CREATE POLICY "Users can view responses to their forms"
  ON responses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM forms
    WHERE forms.id = responses.form_id
    AND forms.owner_id = auth.uid()
  ));

-- Answers policies
CREATE POLICY "Anyone can submit answers to published forms"
  ON answers FOR INSERT
  TO anon
  WITH CHECK (EXISTS (
    SELECT 1 FROM responses
    JOIN forms ON forms.id = responses.form_id
    WHERE responses.id = answers.response_id
    AND forms.is_published = true
  ));

CREATE POLICY "Users can view answers to their form responses"
  ON answers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM responses
    JOIN forms ON forms.id = responses.form_id
    WHERE responses.id = answers.response_id
    AND forms.owner_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forms_owner_id ON forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_questions_form_id ON questions(form_id);
CREATE INDEX IF NOT EXISTS idx_responses_form_id ON responses(form_id);
CREATE INDEX IF NOT EXISTS idx_answers_response_id ON answers(response_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);