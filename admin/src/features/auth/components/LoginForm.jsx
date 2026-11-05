import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { validateEmail, validatePassword } from '../../../utils/validators';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { ROLES } from '../../../utils/constants';

export const LoginForm = () => {
  const [email, setEmail] = useState('vikkypodiyam25@navgurukul.org');
  const [password, setPassword] = useState('Admin@123456');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { login, setRole } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password, 6);

    if (emailErr || passErr) {
      setErrors({ email: emailErr, password: passErr });
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const success = login(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (roleName, demoEmail) => {
    setEmail(demoEmail);
    setPassword('Admin@123456');
    setRole(roleName);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Admin Email"
        type="email"
        placeholder="admin@campus.edu"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        leftIcon={Mail}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        leftIcon={Lock}
        required
      />

      <div className="flex items-center justify-between text-xs pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
          <input
            type="checkbox"
            defaultChecked
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
          />
          <span>Remember this session</span>
        </label>
        <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
          Forgot password?
        </span>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-2"
        isLoading={loading}
        rightIcon={ArrowRight}
      >
        Sign in to Dashboard
      </Button>

      {/* Demo Credentials Helper */}
      <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">
          One-Click Demo Credentials:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleDemoFill(ROLES.SUPER_ADMIN, 'vikkypodiyam25@navgurukul.org')}
            className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-center text-xs hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Super Admin</span>
            <span className="text-[10px] text-slate-400">Full Access</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill(ROLES.ADMIN, 'admin.staff@campus.edu')}
            className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-center text-xs hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Admin</span>
            <span className="text-[10px] text-slate-400">Standard</span>
          </button>

          <button
            type="button"
            onClick={() => handleDemoFill(ROLES.MODERATOR, 'moderator.lead@campus.edu')}
            className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-center text-xs hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Moderator</span>
            <span className="text-[10px] text-slate-400">Reports Only</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
