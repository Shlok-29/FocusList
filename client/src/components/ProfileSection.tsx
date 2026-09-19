import { useState, useEffect } from "react";
import { User, Mail, Briefcase, Target, Sparkles, Check, Edit3, Flame, Clock, Award, ShieldCheck } from "lucide-react";
import { soundFx } from "../lib/soundEffects";

export type UserProfile = {
  name: string;
  email: string;
  role: string;
  bio: string;
  avatarInitials: string;
  dailyGoalHours: number;
};

const PROFILE_STORAGE_KEY = "focuslist-user-profile-v1";

const defaultProfile: UserProfile = {
  name: "Shlok Dubey",
  email: "shlok@focuslist.app",
  role: "Productivity Architect",
  bio: "Designing high-impact focus habits and building sleek web experiences.",
  avatarInitials: "SD",
  dailyGoalHours: 4,
};

export function loadUserProfile(): UserProfile {
  try {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.name) return parsed;
    }
  } catch {}
  return defaultProfile;
}

interface ProfileSectionProps {
  onSaveProfile: (profile: UserProfile) => void;
  totalCompletedTasks: number;
  focusMinutesTotal: number;
}

export default function ProfileSection({
  onSaveProfile,
  totalCompletedTasks,
  focusMinutesTotal,
}: ProfileSectionProps) {
  const [profile, setProfile] = useState<UserProfile>(loadUserProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState(profile.role);
  const [bio, setBio] = useState(profile.bio);
  const [dailyGoalHours, setDailyGoalHours] = useState(profile.dailyGoalHours);

  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase() || "FL";
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    const updated: UserProfile = {
      name: name.trim() || "User",
      email: email.trim(),
      role: role.trim() || "Productivity Enthusiast",
      bio: bio.trim(),
      avatarInitials: getInitials(name),
      dailyGoalHours,
    };
    setProfile(updated);
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    onSaveProfile(updated);
    setIsEditing(false);
  };

  const hoursLogged = (focusMinutesTotal / 60).toFixed(1);

  return (
    <div className="profile-container animate-in fade-in duration-200">
      {/* Profile Header Banner */}
      <div className="profile-hero-card">
        <div className="profile-hero-glow" />
        <div className="profile-avatar-large">
          <span>{profile.avatarInitials}</span>
        </div>
        <div className="profile-hero-info">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="profile-name">{profile.name}</h2>
            <span className="pro-badge"><ShieldCheck size={12} /> PRO MEMBER</span>
          </div>
          <p className="profile-role">{profile.role}</p>
          <p className="profile-bio">"{profile.bio}"</p>
        </div>

        <button
          className="edit-profile-trigger-btn"
          onClick={() => {
            soundFx.playClick();
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? <Check size={15} /> : <Edit3 size={15} />}
          <span>{isEditing ? "Cancel" : "Edit Profile"}</span>
        </button>
      </div>

      {/* Edit Form or Info Display */}
      {isEditing ? (
        <form onSubmit={handleSave} className="profile-edit-card">
          <div className="card-heading">
            <Sparkles size={16} className="text-coral-accent" />
            <h3>Edit Basic Information</h3>
          </div>

          <div className="profile-form-grid">
            <div className="form-group">
              <label className="form-label"><User size={12} /> Full Name</label>
              <input
                type="text"
                className="profile-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Mail size={12} /> Email Address</label>
              <input
                type="email"
                className="profile-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Briefcase size={12} /> Title / Occupation</label>
              <input
                type="text"
                className="profile-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Software Engineer, Designer"
              />
            </div>

            <div className="form-group">
              <label className="form-label"><Target size={12} /> Daily Focus Goal (Hours)</label>
              <select
                className="profile-input"
                value={dailyGoalHours}
                onChange={(e) => setDailyGoalHours(parseInt(e.target.value))}
              >
                <option value={2}>2 Hours / Day</option>
                <option value={4}>4 Hours / Day (Recommended)</option>
                <option value={6}>6 Hours / Day (Deep Worker)</option>
                <option value={8}>8 Hours / Day (Intense)</option>
              </select>
            </div>

            <div className="form-group col-span-2">
              <label className="form-label">Personal Motto / Bio</label>
              <textarea
                className="profile-input resize-y"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief personal motto or productivity bio..."
              />
            </div>
          </div>

          <div className="profile-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-save">
              Save Profile Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="profile-stats-grid">
          <div className="p-stat-card">
            <div className="p-stat-icon text-amber-500"><Flame size={22} /></div>
            <div>
              <span className="p-stat-val">5 Days</span>
              <span className="p-stat-label">Active Focus Streak</span>
            </div>
          </div>

          <div className="p-stat-card">
            <div className="p-stat-icon text-blue-500"><Clock size={22} /></div>
            <div>
              <span className="p-stat-val">{hoursLogged} hrs</span>
              <span className="p-stat-label">Total Focused Time</span>
            </div>
          </div>

          <div className="p-stat-card">
            <div className="p-stat-icon text-emerald-500"><Award size={22} /></div>
            <div>
              <span className="p-stat-val">{totalCompletedTasks} Tasks</span>
              <span className="p-stat-label">Lifetime Tasks Completed</span>
            </div>
          </div>

          <div className="p-stat-card">
            <div className="p-stat-icon text-purple-500"><Target size={22} /></div>
            <div>
              <span className="p-stat-val">{profile.dailyGoalHours}h Goal</span>
              <span className="p-stat-label">Target Daily Capacity</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
