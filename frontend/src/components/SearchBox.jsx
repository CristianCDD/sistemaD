import { Search } from 'lucide-react'

function SearchBox({ value, onChange, placeholder }) {
  return (
    <label className="search-box">
      <Search size={17} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}

export default SearchBox
