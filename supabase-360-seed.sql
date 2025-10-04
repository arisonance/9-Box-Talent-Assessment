-- 360 Feedback Question Templates Seed Data
-- Run this after supabase-schema.sql and supabase-seed.sql

-- Insert question templates by category

-- Leadership Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Leadership', 'Demonstrates clear vision and strategic thinking', 'scale', 1, 5),
('Leadership', 'Effectively delegates and empowers team members', 'scale', 1, 5),
('Leadership', 'Makes timely and well-informed decisions', 'scale', 1, 5),
('Leadership', 'Inspires and motivates others to achieve goals', 'scale', 1, 5),
('Leadership', 'Takes accountability for team outcomes', 'scale', 1, 5),
('Leadership', 'Demonstrates integrity and leads by example', 'scale', 1, 5);

-- Communication Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Communication', 'Communicates ideas clearly and concisely', 'scale', 1, 5),
('Communication', 'Actively listens and considers others'' perspectives', 'scale', 1, 5),
('Communication', 'Provides constructive and timely feedback', 'scale', 1, 5),
('Communication', 'Effectively presents to groups and stakeholders', 'scale', 1, 5),
('Communication', 'Adapts communication style to different audiences', 'scale', 1, 5),
('Communication', 'Keeps team informed of important updates', 'scale', 1, 5);

-- Collaboration Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Collaboration', 'Works effectively with cross-functional teams', 'scale', 1, 5),
('Collaboration', 'Builds strong working relationships', 'scale', 1, 5),
('Collaboration', 'Resolves conflicts constructively', 'scale', 1, 5),
('Collaboration', 'Shares knowledge and expertise willingly', 'scale', 1, 5),
('Collaboration', 'Values diverse perspectives and ideas', 'scale', 1, 5),
('Collaboration', 'Contributes positively to team culture', 'scale', 1, 5);

-- Problem Solving Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Problem Solving', 'Identifies problems proactively', 'scale', 1, 5),
('Problem Solving', 'Analyzes situations thoroughly before acting', 'scale', 1, 5),
('Problem Solving', 'Develops creative and practical solutions', 'scale', 1, 5),
('Problem Solving', 'Considers multiple perspectives when solving problems', 'scale', 1, 5),
('Problem Solving', 'Follows through on solutions to completion', 'scale', 1, 5);

-- Technical Skills Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Technical Skills', 'Demonstrates strong technical competence', 'scale', 1, 5),
('Technical Skills', 'Stays current with industry trends and tools', 'scale', 1, 5),
('Technical Skills', 'Applies technical knowledge effectively', 'scale', 1, 5),
('Technical Skills', 'Seeks opportunities to expand technical skills', 'scale', 1, 5);

-- Adaptability Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Adaptability', 'Adapts quickly to changing priorities', 'scale', 1, 5),
('Adaptability', 'Remains positive and productive under pressure', 'scale', 1, 5),
('Adaptability', 'Embraces new ideas and approaches', 'scale', 1, 5),
('Adaptability', 'Learns from mistakes and feedback', 'scale', 1, 5);

-- Initiative Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Initiative', 'Takes initiative without being asked', 'scale', 1, 5),
('Initiative', 'Seeks out new responsibilities and challenges', 'scale', 1, 5),
('Initiative', 'Drives projects forward independently', 'scale', 1, 5),
('Initiative', 'Identifies and acts on improvement opportunities', 'scale', 1, 5);

-- Results Orientation Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Results Orientation', 'Consistently meets or exceeds goals', 'scale', 1, 5),
('Results Orientation', 'Manages time and priorities effectively', 'scale', 1, 5),
('Results Orientation', 'Delivers high-quality work', 'scale', 1, 5),
('Results Orientation', 'Takes ownership of outcomes', 'scale', 1, 5);

-- Development & Growth Questions
INSERT INTO feedback_360_question_templates (category, question_text, response_type, scale_min, scale_max) VALUES
('Development & Growth', 'Actively seeks feedback for improvement', 'scale', 1, 5),
('Development & Growth', 'Invests in personal and professional development', 'scale', 1, 5),
('Development & Growth', 'Helps others learn and develop', 'scale', 1, 5),
('Development & Growth', 'Shows commitment to continuous improvement', 'scale', 1, 5);

-- Open-ended Questions - Hard-hitting and impactful
INSERT INTO feedback_360_question_templates (category, question_text, response_type) VALUES
('General Feedback', 'What are this person''s greatest strengths?', 'text'),
('General Feedback', 'What areas could this person focus on for development?', 'text'),
('General Feedback', 'What advice would you give this person to help them grow?', 'text'),
('General Feedback', 'Is there anything else you would like to share?', 'text'),
('Impact', 'What is the biggest impact this person has had on you, the team, or the organization?', 'text'),
('Impact', 'If this person left tomorrow, what would be most missed? What would improve?', 'text'),
('Impact', 'Describe a specific situation where this person made a significant difference', 'text'),
('Leadership', 'Would you want to work for this person as a manager? Why or why not?', 'text'),
('Leadership', 'What would make this person a more effective leader?', 'text'),
('Leadership', 'How does this person handle difficult conversations or conflicts?', 'text'),
('Collaboration', 'What is it like to work with this person on a day-to-day basis?', 'text'),
('Collaboration', 'How could this person be a better team player?', 'text'),
('Collaboration', 'Describe how this person responds to feedback and criticism', 'text'),
('Growth', 'What should this person STOP doing to be more effective?', 'text'),
('Growth', 'What should this person START doing to advance their career?', 'text'),
('Growth', 'What should this person CONTINUE doing because it''s working well?', 'text'),
('Growth', 'If you could change one thing about how this person works, what would it be?', 'text'),
('Performance', 'Where do you see this person in 2-3 years if they continue on their current path?', 'text'),
('Performance', 'What''s holding this person back from reaching the next level?', 'text'),
('Performance', 'Rate their performance on their most important responsibilities (be specific)', 'text'),
('Trust', 'Do you trust this person to deliver on their commitments? Explain.', 'text'),
('Trust', 'Would you go to this person for help or advice? Why or why not?', 'text'),
('Trust', 'How does this person handle pressure, setbacks, or failure?', 'text'),
('Value', 'On a scale of 1-10, how valuable is this person to the team? Why that number?', 'text'),
('Value', 'What unique skills or perspective does this person bring that others don''t?', 'text'),
('Value', 'If you were building your dream team, would you choose this person? Why?', 'text');
