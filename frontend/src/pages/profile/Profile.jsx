import BottomNavigation from '../../components/home/BottomNavigation'
import ProfileHero from '../../components/profile/ProfileHero'
import ProfilePets from '../../components/profile/ProfilePets'
import ProfileMenuSection from '../../components/profile/ProfileMenuSection'

export default function Profile() {
  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-slate-50 font-sans text-slate-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="bg-gradient-to-b from-orange-200 via-white to-slate-50 pb-2">
          <ProfileHero />
          <ProfilePets />
        </div>
        <ProfileMenuSection />
      </main>
      <BottomNavigation />
    </div>
  )
}
