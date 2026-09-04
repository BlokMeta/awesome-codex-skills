import type { EmptyStateProps } from '../props/feedback.js';
import { Button } from './Button.js';

export function EmptyState({ title, description, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <section className="hg-empty" data-testid={testID}>
      <h2 className="hg-empty__title">{title}</h2>
      {description ? <p className="hg-empty__description">{description}</p> : null}
      {actionLabel ? (
        <div className="hg-empty__action">
          <Button label={actionLabel} variant="primary" onPress={onAction} />
        </div>
      ) : null}
    </section>
  );
}
