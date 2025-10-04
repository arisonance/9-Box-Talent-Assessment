-- One-on-One Meeting Mock Data
-- Add mock one-on-one meetings for selected employees

-- Variables for easy reference
DO $$
DECLARE
  v_org_id uuid := 'f8a8b8c8-d8e8-4f8f-8f8f-8f8f8f8f8f8f';
  v_manager_id text := 'mock-manager-123';
  v_manager_name text := 'Sarah Chen';

  -- Employee IDs
  v_emp1 uuid := 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1'; -- Sarah Chen (Star Performer)
  v_emp2 uuid := 'e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2'; -- Mike Johnson (Performance Leader)
  v_emp5 uuid := 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5'; -- Emily Brown (Emerging Leader)
  v_emp7 uuid := 'e7e7e7e7-e7e7-e7e7-e7e7-e7e7e7e7e7e7'; -- Olivia Martinez (Steady Contributor)

  -- Meeting IDs
  v_meeting1 uuid;
  v_meeting2 uuid;
  v_meeting3 uuid;
  v_meeting4 uuid;
  v_meeting5 uuid;
  v_meeting6 uuid;
BEGIN

  -- ==================== Sarah Chen (Star Performer) - 2 recent meetings ====================

  -- Meeting 1: Two weeks ago
  v_meeting1 := gen_random_uuid();
  INSERT INTO one_on_one_meetings (id, employee_id, organization_id, manager_id, manager_name, meeting_date, status, duration_minutes, meeting_type)
  VALUES (v_meeting1, v_emp1, v_org_id, v_manager_id, v_manager_name, CURRENT_DATE - INTERVAL '14 days', 'completed', 45, 'regular');

  INSERT INTO one_on_one_shared_notes (meeting_id, note, created_by) VALUES
  (v_meeting1, 'Discussed Q2 product launch - Sarah exceeded all milestones and brought the cross-functional team together brilliantly. Her technical leadership on the new audio processing pipeline was exceptional.', v_manager_name),
  (v_meeting1, 'Sarah mentioned she''s interested in taking on more strategic responsibilities, particularly in technical architecture decisions. Agreed to include her in the next architecture review committee.', v_manager_name);

  INSERT INTO one_on_one_action_items (meeting_id, title, description, assigned_to, due_date, status) VALUES
  (v_meeting1, 'Lead Architecture Review for Q3 Projects', 'Present technical recommendations for audio processing improvements', 'Sarah Chen', CURRENT_DATE + INTERVAL '30 days', 'in_progress'),
  (v_meeting1, 'Mentor Junior Engineers', 'Set up bi-weekly mentoring sessions with 2 junior team members', 'Sarah Chen', CURRENT_DATE + INTERVAL '7 days', 'completed');

  -- Meeting 2: One month ago
  v_meeting2 := gen_random_uuid();
  INSERT INTO one_on_one_meetings (id, employee_id, organization_id, manager_id, manager_name, meeting_date, status, duration_minutes, meeting_type)
  VALUES (v_meeting2, v_emp1, v_org_id, v_manager_id, v_manager_name, CURRENT_DATE - INTERVAL '30 days', 'completed', 40, 'regular');

  INSERT INTO one_on_one_shared_notes (meeting_id, note, created_by) VALUES
  (v_meeting2, 'Reviewed recent customer feedback on new speaker line - Sarah''s technical improvements resulted in 25% improvement in audio clarity metrics. Customers are thrilled.', v_manager_name),
  (v_meeting2, 'Discussed career aspirations - Sarah wants to move into Principal Engineer role within next 12-18 months. She''s on the right track.', v_manager_name);

  -- ==================== Mike Johnson (Performance Leader) - 2 meetings ====================

  -- Meeting 1: One week ago
  v_meeting3 := gen_random_uuid();
  INSERT INTO one_on_one_meetings (id, employee_id, organization_id, manager_id, manager_name, meeting_date, status, duration_minutes, meeting_type)
  VALUES (v_meeting3, v_emp2, v_org_id, v_manager_id, v_manager_name, CURRENT_DATE - INTERVAL '7 days', 'completed', 50, 'regular');

  INSERT INTO one_on_one_shared_notes (meeting_id, note, created_by) VALUES
  (v_meeting3, 'Mike hit 145% of sales quota this quarter - his approach to consultative selling with high-end clients is industry-leading. Won 3 major commercial audio contracts.', v_manager_name),
  (v_meeting3, 'Discussed team dynamics - Mike has been excellent at collaborating with marketing team on new campaigns. His customer insights have been invaluable.', v_manager_name);

  INSERT INTO one_on_one_action_items (meeting_id, title, description, assigned_to, due_date, status) VALUES
  (v_meeting3, 'Document Best Practices', 'Create sales playbook for enterprise deals based on recent wins', 'Mike Johnson', CURRENT_DATE + INTERVAL '21 days', 'in_progress'),
  (v_meeting3, 'Present at Sales Kickoff', 'Share winning strategies with broader team', 'Mike Johnson', CURRENT_DATE + INTERVAL '45 days', 'not_started');

  -- Meeting 2: Three weeks ago
  v_meeting4 := gen_random_uuid();
  INSERT INTO one_on_one_meetings (id, employee_id, organization_id, manager_id, manager_name, meeting_date, status, duration_minutes, meeting_type)
  VALUES (v_meeting4, v_emp2, v_org_id, v_manager_id, v_manager_name, CURRENT_DATE - INTERVAL '21 days', 'completed', 35, 'check_in');

  INSERT INTO one_on_one_shared_notes (meeting_id, note, created_by) VALUES
  (v_meeting4, 'Quick check-in on large deal closing - Mike successfully negotiated the Hilton Hotels contract ($2.5M). His persistence and relationship building paid off.', v_manager_name);

  -- ==================== Emily Brown (Emerging Leader) - 2 meetings ====================

  -- Meeting 1: 10 days ago
  v_meeting5 := gen_random_uuid();
  INSERT INTO one_on_one_meetings (id, employee_id, organization_id, manager_id, manager_name, meeting_date, status, duration_minutes, meeting_type)
  VALUES (v_meeting5, v_emp5, v_org_id, v_manager_id, v_manager_name, CURRENT_DATE - INTERVAL '10 days', 'completed', 40, 'regular');

  INSERT INTO one_on_one_shared_notes (meeting_id, note, created_by) VALUES
  (v_meeting5, 'Emily''s content strategy for the rebrand has been outstanding. Her cross-channel campaigns increased engagement by 40% and generated 200+ quality leads.', v_manager_name),
  (v_meeting5, 'Discussed leadership development - Emily expressed interest in managing a small team. She''s ready for this step and would be excellent at it.', v_manager_name);

  INSERT INTO one_on_one_private_notes (meeting_id, note, created_by, tags) VALUES
  (v_meeting5, 'Consider Emily for Marketing Manager role when position opens in Q4. She has the right mindset and skills.', v_manager_name, ARRAY['succession_planning', 'promotion_candidate']);

  INSERT INTO one_on_one_action_items (meeting_id, title, description, assigned_to, due_date, status) VALUES
  (v_meeting5, 'Complete Leadership Training', 'Enroll in company leadership development program', 'Emily Brown', CURRENT_DATE + INTERVAL '14 days', 'in_progress'),
  (v_meeting5, 'Shadow Current Manager', 'Attend team meetings and observe leadership in action', 'Emily Brown', CURRENT_DATE + INTERVAL '30 days', 'not_started');

  -- ==================== Olivia Martinez (Steady Contributor) - 1 meeting ====================

  -- Meeting 1: Two weeks ago
  v_meeting6 := gen_random_uuid();
  INSERT INTO one_on_one_meetings (id, employee_id, organization_id, manager_id, manager_name, meeting_date, status, duration_minutes, meeting_type)
  VALUES (v_meeting6, v_emp7, v_org_id, v_manager_id, v_manager_name, CURRENT_DATE - INTERVAL '14 days', 'completed', 30, 'regular');

  INSERT INTO one_on_one_shared_notes (meeting_id, note, created_by) VALUES
  (v_meeting6, 'Reviewed Olivia''s work on the benefits enrollment project - delivered on time and error-free. Her attention to detail and process improvement suggestions were valuable.', v_manager_name),
  (v_meeting6, 'Discussed professional development goals - Olivia wants to learn more about compensation analysis. Recommended online courses.', v_manager_name);

  INSERT INTO one_on_one_action_items (meeting_id, title, description, assigned_to, due_date, status) VALUES
  (v_meeting6, 'Complete Compensation Analysis Course', 'LinkedIn Learning course on total rewards', 'Olivia Martinez', CURRENT_DATE + INTERVAL '60 days', 'not_started'),
  (v_meeting6, 'Process Documentation Project', 'Update HR onboarding documentation with recent improvements', 'Olivia Martinez', CURRENT_DATE + INTERVAL '30 days', 'in_progress');

END $$;
