import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, Check, AlertCircle, User, Mail, Lock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/integrations/api/client';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function resolveUrl(url: string) {
  if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url}`;
}

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const { user, updateProfile, updateAvatar } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Username is required';
    else if (username.trim().length < 3) e.username = 'Username must be at least 3 characters';
    else if (username.trim().length > 20) e.username = 'Username must be less than 20 characters';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email address';
    if (newPassword) {
      if (newPassword.length < 6) e.newPassword = 'Password must be at least 6 characters';
      if (newPassword !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setIsUploadingAvatar(true);
    const { error } = await updateAvatar(file);
    setIsUploadingAvatar(false);

    if (error) {
      setAvatarPreview(null);
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Avatar updated!' });
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    const payload: { username?: string; email?: string; password?: string } = {};
    if (username.trim() !== user.username) payload.username = username.trim();
    if (email.trim() !== user.email) payload.email = email.trim();
    if (newPassword) payload.password = newPassword;

    if (Object.keys(payload).length === 0) {
      toast({ title: 'No changes to save' });
      setIsSaving(false);
      return;
    }

    const { error } = await updateProfile(payload);
    setIsSaving(false);

    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});
    }
  };

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const currentAvatarUrl = avatarPreview || user.avatar_url;

  const AvatarDisplay = ({ size = 'lg' }: { size?: 'sm' | 'lg' }) => {
    const dim = size === 'lg' ? 'w-24 h-24' : 'w-10 h-10';
    const iconSize = size === 'lg' ? 'w-10 h-10' : 'w-5 h-5';
    if (currentAvatarUrl) {
      return (
        <img
          src={resolveUrl(currentAvatarUrl)}
          alt={user.username}
          className={`${dim} rounded-full object-cover ring-2 ring-border`}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      );
    }
    return (
      <div className={`${dim} rounded-full bg-muted ring-2 ring-border flex items-center justify-center`}>
        <User className={`${iconSize} text-secondary`} />
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl sm:mx-4 max-h-[90vh] flex flex-col"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mt-3 flex-shrink-0" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
              <h2 className="text-base font-semibold text-foreground">Edit Profile</h2>
              <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4 text-secondary" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 scrollbar-thin">
              {/* Avatar section */}
              <div className="flex flex-col items-center pt-6 pb-4 px-5">
                <div className="relative group">
                  <AvatarDisplay size="lg" />

                  {/* Upload overlay */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {isUploadingAvatar
                      ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                      : <Camera className="w-6 h-6 text-white" />
                    }
                  </button>

                  {/* Online dot */}
                  <span className="absolute bottom-0.5 right-0.5 w-4 h-4 bg-safe rounded-full border-2 border-card" />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="mt-3 text-xs text-safe hover:text-safe/80 transition-colors font-medium"
                >
                  {isUploadingAvatar ? 'Uploading...' : 'Change photo'}
                </button>

                {memberSince && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-secondary">
                    <Calendar className="w-3 h-3" />
                    <span>Member since {memberSince}</span>
                  </div>
                )}
              </div>

              {/* Form */}
              <div className="px-5 pb-5 space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-secondary" /> Username
                  </Label>
                  <Input
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrors(p => ({ ...p, username: '' })); }}
                    placeholder="Your username"
                    className={`h-10 text-sm ${errors.username ? 'border-toxic focus-visible:ring-toxic' : ''}`}
                  />
                  {errors.username && (
                    <p className="text-xs text-toxic flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.username}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-secondary" /> Email
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
                    placeholder="Your email"
                    className={`h-10 text-sm ${errors.email ? 'border-toxic focus-visible:ring-toxic' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-toxic flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.email}
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-secondary">Change Password</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-secondary" /> New Password
                  </Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setErrors(p => ({ ...p, newPassword: '' })); }}
                    placeholder="Leave blank to keep current"
                    className={`h-10 text-sm ${errors.newPassword ? 'border-toxic focus-visible:ring-toxic' : ''}`}
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-toxic flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.newPassword}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1.5"
                  >
                    <Label className="text-sm text-foreground flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-secondary" /> Confirm Password
                    </Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: '' })); }}
                      placeholder="Repeat new password"
                      className={`h-10 text-sm ${errors.confirmPassword ? 'border-toxic focus-visible:ring-toxic' : ''}`}
                    />
                    {errors.confirmPassword && (
                      <p className="text-xs text-toxic flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />{errors.confirmPassword}
                      </p>
                    )}
                    {confirmPassword && newPassword === confirmPassword && (
                      <p className="text-xs text-safe flex items-center gap-1">
                        <Check className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-border flex gap-3 flex-shrink-0">
              <Button variant="outline" onClick={onClose} className="flex-1 h-10 text-sm">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 h-10 text-sm bg-safe hover:bg-safe/90 text-foreground"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
