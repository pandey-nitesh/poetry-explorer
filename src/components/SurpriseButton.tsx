import { useSurprise } from '../hooks/useSurprise';
import styles from './SurpriseButton.module.css';

interface Props {
  className?: string;
}

// Distinguished by placement + label, not decoration. (DESIGN — Components / Surprise me)
export function SurpriseButton({ className }: Props) {
  const { surprise, loading } = useSurprise();
  return (
    <button
      type="button"
      className={className ?? styles.btn}
      onClick={surprise}
      disabled={loading}
    >
      {loading ? 'Finding a poem…' : 'Surprise me'}
    </button>
  );
}
