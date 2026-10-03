import { ChangeDetectionStrategy } from '@angular/core';

const EAGER_KEY = 'Eager' as keyof typeof ChangeDetectionStrategy;

export const EAGER_CHANGE_DETECTION: ChangeDetectionStrategy =
  (ChangeDetectionStrategy as Partial<Record<typeof EAGER_KEY, ChangeDetectionStrategy>>)[
    EAGER_KEY
  ] ?? ChangeDetectionStrategy.Default;
