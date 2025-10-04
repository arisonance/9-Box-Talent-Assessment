insert into box_definitions (key, label, description, action_hint, color, grid_x, grid_y) values
  ('low_low', 'Realign & Redirect', 'Not delivering; can’t adapt', 'Realign or exit 3–6 mo', '#9CA3AF', 1, 1),
  ('medium_low', 'Core Foundation', 'Solid; limited potential', 'Focus, motivate, retain', '#60A5FA', 2, 1),
  ('high_low', 'Master Craftsperson', 'Expert; right level', 'Retain; mentor others', '#34D399', 3, 1),
  ('low_medium', 'Evaluate Further', 'Potential present; not meeting', 'Improve or move 6 mo', '#F59E0B', 1, 2),
  ('medium_medium', 'Steady Contributor', 'Reliable; meets', 'Engage & retain', '#A78BFA', 2, 2),
  ('high_medium', 'Performance Leader', 'Exceptional results', 'Challenge; promote ≤24 mo', '#22C55E', 3, 2),
  ('low_high', 'Rising Talent', 'Underperforming; high potential', 'Coach to performance ≤6 mo', '#F97316', 1, 3),
  ('medium_high', 'Emerging Leader', 'Meets; ready for more', 'Develop; promote ≤24 mo', '#10B981', 2, 3),
  ('high_high', 'Star / Top Talent', 'Exceeds; fast learner', 'Challenge; promote ≤12 mo', '#16A34A', 3, 3)
  on conflict (key) do update set
    label = excluded.label,
    description = excluded.description,
    action_hint = excluded.action_hint,
    color = excluded.color,
    grid_x = excluded.grid_x,
    grid_y = excluded.grid_y;
