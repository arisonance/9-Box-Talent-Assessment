import { useState } from 'react';
import { X, Calendar, Clock, MapPin, Plus, Trash2, CheckCircle2, Circle, Lock, Users } from 'lucide-react';
import type {
  Employee,
  OneOnOneMeeting,
  OneOnOneAgendaItem,
  OneOnOneSharedNote,
  OneOnOnePrivateNote,
  OneOnOneActionItem,
  OneOnOneMeetingStatus,
  OneOnOneMeetingType,
  OneOnOneActionItemStatus
} from '../types';

interface OneOnOneModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  organizationId: string;
  currentUserName: string;
  currentUserId: string;
}

type ModalView = 'list' | 'create' | 'meeting';

interface MeetingForm {
  meetingDate: string;
  meetingTime: string;
  durationType: '30' | '60' | '90';
  location: string;
  meetingType: OneOnOneMeetingType;
  template: 'sonance' | 'rob_roland' | 'okr_focused' | 'delegation' | 'none';
}

// Meeting Templates
const MEETING_TEMPLATES = {
  sonance: {
    name: 'Sonance 1:1 Manager Template',
    sections: [
      {
        title: 'Personal and Professional Check-in',
        items: [
          'How are things going in general?',
          'What is the stress level?',
          'What do you want me to know?',
          'Anything I can do to help?',
          'What are your top three priorities right now?',
          'Is anything slowing you down in being successful on those areas?',
          'How can I help you win?'
        ]
      },
      {
        title: 'Tactical and FYI - Topics',
        items: ['Open discussion topics']
      },
      {
        title: 'Strategic (OKRs)',
        items: ['Are there any issues or conflicts within the team that we need to address?']
      },
      {
        title: 'Can you please give me Feedback?',
        items: ['Open feedback discussion']
      }
    ]
  },
  rob_roland: {
    name: '1:1 Template by Rob Roland',
    sections: [
      {
        title: 'CHECK-IN | How are you doing?',
        items: ['Personal and professional well-being check']
      },
      {
        title: 'TOPICS FOR DECISION | with proposed recommendation',
        items: ['Items requiring decisions']
      },
      {
        title: 'TOPICS FOR DISCUSSION | Items you need to discuss',
        items: ['Discussion topics']
      },
      {
        title: 'OKRs | Progress Update',
        items: ['OKR progress review']
      },
      {
        title: 'AI | How are you leveraging AI today?',
        items: ['AI usage and opportunities']
      }
    ]
  },
  okr_focused: {
    name: 'OKR Focused Conversation Guide',
    sections: [
      {
        title: 'Progress Questions',
        items: [
          'How are you progressing on your OKRs since our last check-in?',
          'Which key result are you most/least confident about right now?',
          'Are we on track to hit this objective by the end of the cycle? What makes you say that?'
        ]
      },
      {
        title: 'Obstacles/Challenge Questions',
        items: [
          'What\'s getting in the way of progress on [specific Key Result]?',
          'Is there anything slowing you down that I can help unblock?',
          'Are you waiting on anyone else or any decisions to move forward?'
        ]
      },
      {
        title: 'Focus & Priority Questions',
        items: [
          'Are you spending enough time on the things that move the needle for these OKRs?',
          'Are there distractions or competing priorities we need to resolve?',
          'What can we de-prioritize to help you focus on this?'
        ]
      },
      {
        title: 'Learning & Adjustment Questions',
        items: [
          'What have you learned so far in working toward this objective?',
          'Do we need to adjust any key results or expectations based on what we now know?',
          'If you had to hit this Key Result in half the time, what would you change?'
        ]
      },
      {
        title: 'Next Steps & Ownership Questions',
        items: [
          'What\'s your next step toward hitting [specific Key Result]?',
          'Who else do you need to work with or influence to make progress?',
          'What would make this OKR feel like a big win at the end of the cycle?'
        ]
      },
      {
        title: 'Metrics & Results Questions',
        items: [
          'What\'s the current metric for [Key Result] and how has it trended?',
          'How will we know if this result is truly moving the objective forward?',
          'What would success look like in hard numbers?'
        ]
      }
    ]
  },
  delegation: {
    name: 'Delegation Framework 1:1 Meeting',
    sections: [
      {
        title: 'Work Distribution',
        items: [
          'Looking at your current work, what\'s on your plate that should be on mine, and what\'s on my plate that should be on yours?',
          'Let\'s review your main projects - which are Level 1 (recommend first), Level 2 (act then inform), or Level 3 (full ownership)?'
        ]
      },
      {
        title: 'Priority Clarity',
        items: ['Pick your biggest priority - can you brief back what success looks like and your next steps?']
      },
      {
        title: 'Growth & Delegation Levels',
        items: [
          'Which Level 1 tasks are you ready to move to Level 2, and what support do you need to get there?',
          'For your Level 2 and 3 projects, when should we check in, and what would make you need to loop me in sooner?',
          'Optional: What skills or experiences do you need to take on more Level 3 (full ownership) work?'
        ]
      }
    ]
  }
};

export default function OneOnOneModal({
  isOpen,
  onClose,
  employee,
  organizationId,
  currentUserName,
  currentUserId,
}: OneOnOneModalProps) {
  const [view, setView] = useState<ModalView>('list');
  const [meetings, setMeetings] = useState<OneOnOneMeeting[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<OneOnOneMeeting | null>(null);

  // Meeting form state
  const [meetingForm, setMeetingForm] = useState<MeetingForm>({
    meetingDate: new Date().toISOString().split('T')[0],
    meetingTime: '10:00',
    durationType: '30',
    location: '',
    meetingType: 'regular',
    template: 'sonance',
  });

  // Meeting detail state
  const [agendaItems, setAgendaItems] = useState<OneOnOneAgendaItem[]>([]);
  const [sharedNotes, setSharedNotes] = useState<OneOnOneSharedNote[]>([]);
  const [privateNotes, setPrivateNotes] = useState<OneOnOnePrivateNote[]>([]);
  const [actionItems, setActionItems] = useState<OneOnOneActionItem[]>([]);

  // Form state
  const [newAgendaTitle, setNewAgendaTitle] = useState('');
  const [newAgendaDescription, setNewAgendaDescription] = useState('');
  const [newSharedNote, setNewSharedNote] = useState('');
  const [newPrivateNote, setNewPrivateNote] = useState('');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState<'manager' | 'employee'>('employee');
  const [newActionDueDate, setNewActionDueDate] = useState('');

  if (!isOpen) return null;

  const handleCreateMeeting = () => {
    const newMeeting: OneOnOneMeeting = {
      id: `meeting-${Date.now()}`,
      employee_id: employee.id,
      organization_id: organizationId,
      manager_id: currentUserId,
      manager_name: currentUserName,
      meeting_date: `${meetingForm.meetingDate}T${meetingForm.meetingTime}:00Z`,
      status: 'scheduled',
      duration_minutes: parseInt(meetingForm.durationType),
      location: meetingForm.location || undefined,
      meeting_type: meetingForm.meetingType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMeetings([newMeeting, ...meetings]);
    setSelectedMeeting(newMeeting);

    // Load template agenda if selected
    const templateAgenda: OneOnOneAgendaItem[] = [];
    if (meetingForm.template !== 'none') {
      const template = MEETING_TEMPLATES[meetingForm.template];
      let orderIndex = 0;

      template.sections.forEach(section => {
        section.items.forEach(item => {
          templateAgenda.push({
            id: `agenda-${Date.now()}-${orderIndex}`,
            meeting_id: newMeeting.id,
            title: item,
            description: `From: ${section.title}`,
            added_by: currentUserName,
            order_index: orderIndex++,
            is_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
      });
    }

    setAgendaItems(templateAgenda);
    setSharedNotes([]);
    setPrivateNotes([]);
    setActionItems([]);
    setView('meeting');
  };

  const handleOpenMeeting = (meeting: OneOnOneMeeting) => {
    setSelectedMeeting(meeting);
    // In production, fetch meeting details here
    setView('meeting');
  };

  const handleAddAgendaItem = () => {
    if (!newAgendaTitle.trim() || !selectedMeeting) return;

    const newItem: OneOnOneAgendaItem = {
      id: `agenda-${Date.now()}`,
      meeting_id: selectedMeeting.id,
      title: newAgendaTitle,
      description: newAgendaDescription || undefined,
      added_by: currentUserName,
      order_index: agendaItems.length,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setAgendaItems([...agendaItems, newItem]);
    setNewAgendaTitle('');
    setNewAgendaDescription('');
  };

  const handleToggleAgendaItem = (itemId: string) => {
    setAgendaItems(agendaItems.map(item =>
      item.id === itemId
        ? {
            ...item,
            is_completed: !item.is_completed,
            completed_at: !item.is_completed ? new Date().toISOString() : undefined,
          }
        : item
    ));
  };

  const handleAddSharedNote = () => {
    if (!newSharedNote.trim() || !selectedMeeting) return;

    const newNote: OneOnOneSharedNote = {
      id: `shared-${Date.now()}`,
      meeting_id: selectedMeeting.id,
      note: newSharedNote,
      created_by: currentUserName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSharedNotes([...sharedNotes, newNote]);
    setNewSharedNote('');
  };

  const handleAddPrivateNote = () => {
    if (!newPrivateNote.trim() || !selectedMeeting) return;

    const newNote: OneOnOnePrivateNote = {
      id: `private-${Date.now()}`,
      meeting_id: selectedMeeting.id,
      note: newPrivateNote,
      created_by: currentUserName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setPrivateNotes([...privateNotes, newNote]);
    setNewPrivateNote('');
  };

  const handleAddActionItem = () => {
    if (!newActionTitle.trim() || !selectedMeeting) return;

    const newAction: OneOnOneActionItem = {
      id: `action-${Date.now()}`,
      meeting_id: selectedMeeting.id,
      title: newActionTitle,
      assigned_to: newActionAssignee === 'manager' ? currentUserName : employee.name,
      due_date: newActionDueDate || undefined,
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setActionItems([...actionItems, newAction]);
    setNewActionTitle('');
    setNewActionAssignee('employee');
    setNewActionDueDate('');
  };

  const handleUpdateActionStatus = (actionId: string, status: OneOnOneActionItemStatus) => {
    setActionItems(actionItems.map(action =>
      action.id === actionId
        ? {
            ...action,
            status,
            completed_at: status === 'completed' ? new Date().toISOString() : undefined,
          }
        : action
    ));
  };

  const handleUpdateMeetingStatus = (status: OneOnOneMeetingStatus) => {
    if (!selectedMeeting) return;

    const updatedMeeting = { ...selectedMeeting, status };
    setSelectedMeeting(updatedMeeting);
    setMeetings(meetings.map(m => m.id === selectedMeeting.id ? updatedMeeting : m));
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFullDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getStatusColor = (status: OneOnOneMeetingStatus) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionStatusColor = (status: OneOnOneActionItemStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">One-on-One Meetings</h2>
              <p className="text-purple-100 text-sm">
                {employee.name} • {employee.title || 'No Title'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* View Navigation */}
        {view !== 'list' && (
          <div className="px-6 pt-4 border-b">
            <button
              onClick={() => setView('list')}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
            >
              ← Back to Meetings
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {view === 'list' && (
            <div className="p-6">
              {/* Create Meeting Button */}
              <button
                onClick={() => setView('create')}
                className="w-full mb-6 py-4 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Schedule New Meeting
              </button>

              {/* Meetings List */}
              {meetings.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Meetings Yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Schedule your first one-on-one meeting with {employee.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      onClick={() => handleOpenMeeting(meeting)}
                      className="p-5 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-purple-600 mt-1" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatDateTime(meeting.meeting_date)}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {meeting.duration_minutes} min
                              </span>
                              {meeting.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {meeting.location}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(meeting.status)}`}>
                          {meeting.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="ml-8">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {meeting.meeting_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'create' && (
            <div className="p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Schedule New Meeting</h3>

              <div className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Date
                  </label>
                  <input
                    type="date"
                    value={meetingForm.meetingDate}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Time
                  </label>
                  <input
                    type="time"
                    value={meetingForm.meetingTime}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['30', '60', '90'].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setMeetingForm({ ...meetingForm, durationType: duration as '30' | '60' | '90' })}
                        className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                          meetingForm.durationType === duration
                            ? 'border-purple-600 bg-purple-50 text-purple-700'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {duration} min
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={meetingForm.location}
                    onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                    placeholder="e.g., Conference Room A, Zoom, etc."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={meetingForm.meetingType}
                    onChange={(e) => setMeetingForm({ ...meetingForm, meetingType: e.target.value as OneOnOneMeetingType })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="regular">Regular Check-in</option>
                    <option value="performance">Performance Review</option>
                    <option value="development">Career Development</option>
                    <option value="check_in">Quick Check-in</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Agenda Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agenda Template
                  </label>
                  <select
                    value={meetingForm.template}
                    onChange={(e) => setMeetingForm({ ...meetingForm, template: e.target.value as MeetingForm['template'] })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="sonance">Sonance 1:1 Manager Template (Recommended)</option>
                    <option value="rob_roland">1:1 Template by Rob Roland</option>
                    <option value="okr_focused">OKR Focused Conversation Guide</option>
                    <option value="delegation">Delegation Framework 1:1 Meeting</option>
                    <option value="none">Blank Agenda (No Template)</option>
                  </select>
                  {meetingForm.template !== 'none' && (
                    <p className="mt-2 text-sm text-gray-600">
                      ✓ {MEETING_TEMPLATES[meetingForm.template].name} will be added to the agenda
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setView('list')}
                    className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMeeting}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Create Meeting
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'meeting' && selectedMeeting && (
            <div className="p-6">
              {/* Meeting Header */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {formatDateTime(selectedMeeting.meeting_date)}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {selectedMeeting.duration_minutes} minutes
                      </span>
                      {selectedMeeting.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {selectedMeeting.location}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                        {selectedMeeting.meeting_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMeeting.status)}`}>
                      {selectedMeeting.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Meeting Controls */}
                {selectedMeeting.status === 'scheduled' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateMeetingStatus('in_progress')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Start Meeting
                    </button>
                    <button
                      onClick={() => handleUpdateMeetingStatus('cancelled')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Cancel Meeting
                    </button>
                  </div>
                )}
                {selectedMeeting.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateMeetingStatus('completed')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Complete Meeting
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Agenda & Shared Notes */}
                <div className="space-y-6">
                  {/* Agenda Items */}
                  <div className="border-2 border-gray-200 rounded-xl p-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600" />
                      Agenda Items
                    </h4>

                    {/* Add Agenda Item */}
                    <div className="mb-4 space-y-2">
                      <input
                        type="text"
                        value={newAgendaTitle}
                        onChange={(e) => setNewAgendaTitle(e.target.value)}
                        placeholder="Agenda item title..."
                        maxLength={200}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <textarea
                        value={newAgendaDescription}
                        onChange={(e) => setNewAgendaDescription(e.target.value)}
                        placeholder="Description (optional)..."
                        maxLength={2000}
                        rows={2}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                      <button
                        onClick={handleAddAgendaItem}
                        disabled={!newAgendaTitle.trim()}
                        className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Agenda Item
                      </button>
                    </div>

                    {/* Agenda List */}
                    <div className="space-y-2">
                      {agendaItems.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No agenda items yet. Add topics to discuss.
                        </p>
                      ) : (
                        agendaItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                          >
                            <button
                              onClick={() => handleToggleAgendaItem(item.id)}
                              className="mt-0.5 flex-shrink-0"
                            >
                              {item.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                {item.title}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Added by {item.added_by}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Shared Notes */}
                  <div className="border-2 border-gray-200 rounded-xl p-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Shared Notes
                      <span className="text-xs font-normal text-gray-500">(Both can see)</span>
                    </h4>

                    {/* Add Shared Note */}
                    <div className="mb-4 space-y-2">
                      <textarea
                        value={newSharedNote}
                        onChange={(e) => setNewSharedNote(e.target.value)}
                        placeholder="Add a shared note that both you and the employee can see..."
                        maxLength={5000}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {newSharedNote.length}/5000
                        </span>
                        <button
                          onClick={handleAddSharedNote}
                          disabled={!newSharedNote.trim()}
                          className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Note
                        </button>
                      </div>
                    </div>

                    {/* Shared Notes List */}
                    <div className="space-y-3">
                      {sharedNotes.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No shared notes yet. Document discussion points here.
                        </p>
                      ) : (
                        sharedNotes.map((note) => (
                          <div key={note.id} className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Users className="w-4 h-4 text-blue-600" />
                                  <span className="text-xs font-semibold text-gray-900">
                                    {note.created_by}
                                  </span>
                                  <span className="px-2 py-0.5 bg-blue-200 text-blue-800 text-xs font-semibold rounded">
                                    Shared
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-700">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-medium">{formatFullDateTime(note.created_at)}</span>
                                  <span className="text-gray-500">({formatRelativeTime(note.created_at)})</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {note.note}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Private Notes & Action Items */}
                <div className="space-y-6">
                  {/* Private Manager Notes */}
                  <div className="border-2 border-orange-200 rounded-xl p-5 bg-orange-50/30">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-orange-600" />
                      Private Manager Notes
                      <span className="text-xs font-normal text-gray-500">(Manager only)</span>
                    </h4>

                    {/* Add Private Note */}
                    <div className="mb-4 space-y-2">
                      <textarea
                        value={newPrivateNote}
                        onChange={(e) => setNewPrivateNote(e.target.value)}
                        placeholder="Private observations, concerns, or reminders (not visible to employee)..."
                        maxLength={5000}
                        rows={3}
                        className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none bg-white"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {newPrivateNote.length}/5000
                        </span>
                        <button
                          onClick={handleAddPrivateNote}
                          disabled={!newPrivateNote.trim()}
                          className="py-2 px-4 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          Add Private Note
                        </button>
                      </div>
                    </div>

                    {/* Private Notes List */}
                    <div className="space-y-3">
                      {privateNotes.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No private notes yet. Track confidential observations here.
                        </p>
                      ) : (
                        privateNotes.map((note) => (
                          <div key={note.id} className="p-4 bg-white border-2 border-orange-300 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Lock className="w-4 h-4 text-orange-600" />
                                  <span className="text-xs font-semibold text-gray-900">
                                    {note.created_by}
                                  </span>
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded">
                                    Private
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-700">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-medium">{formatFullDateTime(note.created_at)}</span>
                                  <span className="text-gray-500">({formatRelativeTime(note.created_at)})</span>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                              {note.note}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="border-2 border-gray-200 rounded-xl p-5">
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Action Items
                    </h4>

                    {/* Add Action Item */}
                    <div className="mb-4 space-y-2">
                      <input
                        type="text"
                        value={newActionTitle}
                        onChange={(e) => setNewActionTitle(e.target.value)}
                        placeholder="Action item..."
                        maxLength={200}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={newActionAssignee}
                          onChange={(e) => setNewActionAssignee(e.target.value as 'manager' | 'employee')}
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="employee">Assign to {employee.name}</option>
                          <option value="manager">Assign to Me</option>
                        </select>
                        <input
                          type="date"
                          value={newActionDueDate}
                          onChange={(e) => setNewActionDueDate(e.target.value)}
                          className="px-3 py-2 border-2 border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={handleAddActionItem}
                        disabled={!newActionTitle.trim()}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Action Item
                      </button>
                    </div>

                    {/* Action Items List */}
                    <div className="space-y-2">
                      {actionItems.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No action items yet. Add follow-up tasks here.
                        </p>
                      ) : (
                        actionItems.map((action) => (
                          <div
                            key={action.id}
                            className="p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-sm font-medium text-gray-900 flex-1">
                                {action.title}
                              </p>
                              <select
                                value={action.status}
                                onChange={(e) => handleUpdateActionStatus(action.id, e.target.value as OneOnOneActionItemStatus)}
                                className={`text-xs px-2 py-1 rounded border-0 font-medium ${getActionStatusColor(action.status)}`}
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className="font-medium">{action.assigned_to}</span>
                              {action.due_date && (
                                <span>Due: {new Date(action.due_date).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
