import { useEffect, useRef, useState } from 'react';
import { useToast } from '../../hooks/useToast';
import { copyText } from '../../lib/clipboard';
import { Button, type ButtonProps } from './Button';

export type CopyButtonProps = Omit<ButtonProps, 'onClick' | 'children'> & {
  value: string;
  /** Accessible name; also the visible label. */
  label?: string;
};

/** The header lozenge: its label flips to a confirmation for a moment. */
export function CopyButton({ value, label = 'Copy link', ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  useEffect(() => () => clearTimeout(timer.current ?? undefined), []);

  const onClick = async () => {
    if (!(await copyText(value))) {
      // Both clipboard paths refused: without this the click looks ignored.
      toast({
        id: 'copy',
        variant: 'error',
        message: 'Could not copy the link — select the address bar instead.',
      });
      return;
    }

    toast({ id: 'copy', variant: 'success', message: 'Room link copied.' });

    setCopied(true);
    clearTimeout(timer.current ?? undefined);
    timer.current = setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button
      variant="mono"
      size="chip"
      onClick={() => void onClick()}
      aria-label={copied ? 'Link copied' : label}
      title={label}
      {...props}
    >
      {copied ? 'Copied' : label}
    </Button>
  );
}
