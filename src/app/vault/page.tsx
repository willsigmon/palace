import { VaultStats } from '@/components/vault/vault-stats'

export default function VaultPage() {
  return (
    <div className="mx-auto max-w-2xl px-[var(--space-page)] py-12">
      <header className="mb-10 text-center">
        <h1 className="gradient-text text-[length:var(--text-3xl)] font-bold font-[family-name:var(--font-serif)] italic">
          The Vault
        </h1>
        <p className="mt-2 text-[12px] text-muted/40 uppercase tracking-widest">
          Your life, in numbers
        </p>
      </header>

      <VaultStats />
    </div>
  )
}
