import HomeHeader from '../../components/home/HomeHeader.jsx'
import PetSection from '../../components/home/PetSection.jsx'
import AIRecommendation from '../../components/home/AIRecommendation.jsx'
import RecommendedProducts from '../../components/home/RecommendedProducts.jsx'
import BottomNavigation from '../../components/home/BottomNavigation.jsx'

export default function Home() {
  return (
    <div className="mx-auto flex h-[100dvh] w-full min-w-0 max-w-[430px] flex-col overflow-hidden bg-gray-50 font-sans text-gray-800 min-[431px]:shadow-[0_0_40px_rgba(17,24,39,0.10)]">
      <HomeHeader />
      <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <PetSection />
        <AIRecommendation />
        <RecommendedProducts />
        <div className="h-4" />
      </main>
      <BottomNavigation />
    </div>
  )
}
