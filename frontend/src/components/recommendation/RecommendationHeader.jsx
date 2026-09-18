import { Link } from 'react-router-dom'

export default function RecommendationHeader() {
  return <header className="simple-page-header"><Link to="/home" className="simple-page-back">กลับ</Link><h1>AI แนะนำ</h1><span className="simple-page-icon"><i className="fa-solid fa-wand-magic-sparkles" /></span></header>
}
