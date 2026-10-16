import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scenarios, type Ticket } from '../src/data';
import ManagerIntake from '../src/sections/ManagerIntake';
import TicketLaunchpad from '../src/sections/TicketLaunchpad';

const mocked = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));

vi.mock('../src/store', () => ({ useNexus: () => mocked.current }));
vi.mock('../src/locale', () => ({
  useLocale: () => ({ locale: 'en', t: (key: string) => ({ 'intake.title': 'Manager Intake', 'intake.form': 'Transition intake form', 'intake.completeness': 'Intake completeness', 'form.generate': 'Generate Transition Bundle' }[key] ?? key) }),
}));

const optionalTicket: Ticket = {
  id: 'ticket-optional', name: 'Onboarding plan', category: 'Training', status: 'optional',
  approvalPath: 'Manager approval', actionType: 'onrequest', actionLabel: 'Future scope',
  icon: 'file-text', required: false, included: true,
};

describe('primary UI persistence gates', () => {
  beforeEach(() => { mocked.current = {}; });

  it('enables generation for a valid arbitrary draft when persistence is connected', () => {
    mocked.current = {
      form: { ...scenarios.newhire.form, name: 'Arbitrary Manual Employee' },
      updateField: () => undefined, loadDemo: () => undefined, activeScenario: null,
      activeCase: { id: 'Unsaved', source: 'draft' }, startEditableDemo: async () => undefined,
      generateBundle: async () => undefined, bundleGenerated: false,
      backendStatus: 'connected', backendMessage: 'Persistent storage connected.',
    };
    const html = renderToStaticMarkup(<ManagerIntake onGenerate={() => undefined} />);
    expect(html).toContain('Arbitrary Manual Employee');
    expect(html).toContain('Generate Transition Bundle');
    expect(html).not.toContain('Persistent workflow unavailable');
  });

  it('explains why fixture actions are read-only and offers an editable copy', () => {
    mocked.current = {
      tickets: [optionalTicket], submitted: false, submitBundle: async () => undefined,
      updateTicketStatus: async () => undefined, updateTicketDraft: async () => undefined,
      bundleGenerated: true, activeCase: { id: 'ONB-FICTIONAL-MARYAM', source: 'fixture' },
      startEditableDemo: async () => undefined, backendStatus: 'connected',
    };
    const html = renderToStaticMarkup(<TicketLaunchpad onToast={() => undefined} />);
    expect(html).toContain('Read-only fictional fixture');
    expect(html).toContain('Start Editable Demo');
    expect(html).toContain('This fixture is read-only');
  });

  it('renders editable draft controls and submission for a persistent case', () => {
    mocked.current = {
      tickets: [optionalTicket], submitted: false, submitBundle: async () => undefined,
      updateTicketStatus: async () => undefined, updateTicketDraft: async () => undefined,
      bundleGenerated: true, activeCase: { id: 'ONB-TEST', recordId: 'record-1', source: 'persistent' },
      startEditableDemo: async () => undefined, backendStatus: 'connected',
    };
    const html = renderToStaticMarkup(<TicketLaunchpad onToast={() => undefined} />);
    expect(html).toContain('aria-label="Title for Onboarding plan"');
    expect(html).toContain('Simulate Bulk Submit');
    expect(html).not.toContain('Read-only fictional fixture');
  });
});
