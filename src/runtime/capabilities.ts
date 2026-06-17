export const requiredCapabilities = ['obra', 'pr_monkey', 'qa'] as const;

export type RequiredCapability = (typeof requiredCapabilities)[number];

export interface CapabilityRegistry {
  registered: string[];
  missing: RequiredCapability[];
}

export function registerCapabilities(existing: readonly string[] = []): CapabilityRegistry {
  const registered = Array.from(new Set([...existing, ...requiredCapabilities]));
  const missing = requiredCapabilities.filter((capability) => !registered.includes(capability));

  return {
    registered,
    missing,
  };
}

export function assertMandatoryCapabilities(existing: readonly string[] = []): void {
  const { missing } = registerCapabilities(existing);
  if (missing.length > 0) {
    throw new Error(`Missing mandatory capabilities: ${missing.join(', ')}`);
  }
}
