import React, { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../../i18n';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

const PasswordInput: React.FC<PasswordInputProps> = ({ className = '', disabled, ...inputProps }) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...inputProps}
        type={visible ? 'text' : 'password'}
        disabled={disabled}
        className={`${className} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        disabled={disabled}
        aria-label={t(visible ? 'common.hidePassword' : 'common.showPassword')}
        aria-pressed={visible}
        title={t(visible ? 'common.hidePassword' : 'common.showPassword')}
        className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#c6e911] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? <EyeOff aria-hidden="true" className="h-5 w-5" /> : <Eye aria-hidden="true" className="h-5 w-5" />}
      </button>
    </div>
  );
};

export default PasswordInput;
