import { ProfileForm } from "@/features/profile/components/profile-form"
import { LangSwitcher } from "@/components/ui/lang-switcher"

export default function ProfilePage() {
  return (
    <main className="relative min-h-screen bg-[#070B17] text-white p-6">
      {/* Language switcher */}
      <div className="absolute right-6 top-6 z-20">
        <LangSwitcher />
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <ProfileForm />
      </div>
    </main>
  )
}