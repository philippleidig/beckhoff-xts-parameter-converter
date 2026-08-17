import { CompareIcon, ConvertIcon, CreateIcon, TutorialIcon, ChevronRightIcon } from '@/components/ui/Icons'
import type { View } from '@/lib/navigation/useHashView'
import './Home.css'

interface Tile {
  view: Exclude<View, 'home'>
  title: string
  tagline: string
  description: string
  Icon: typeof CompareIcon
}

const TILES: Tile[] = [
  {
    view: 'tutorial',
    title: 'Tutorial',
    tagline: 'Migrate an existing machine',
    description:
      'Step-by-step walkthrough for switching an XTS from SoftDrive to the MoverController, from exporting the old parameters to rebuilding the movers.',
    Icon: TutorialIcon,
  },
  {
    view: 'compare',
    title: 'Compare',
    tagline: 'Spot what changed',
    description:
      'Compare two SoftDrive parameter sets or two MoverController parameter sets — against each other or against the default values.',
    Icon: CompareIcon,
  },
  {
    view: 'convert',
    title: 'Convert',
    tagline: 'SoftDrive to MoverController',
    description:
      'Import an existing SoftDrive parameter set, pick the magnet plate and export the converted MoverController parameter set.',
    Icon: ConvertIcon,
  },
  {
    view: 'create',
    title: 'Create',
    tagline: 'Start from scratch',
    description:
      'Build a new MoverController parameter set from the default values and export it as an XTI file.',
    Icon: CreateIcon,
  },
]

interface HomeProps {
  onNavigate: (view: View) => void
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="home">
      <div className="home-tiles">
        {TILES.map(({ view, title, tagline, description, Icon }) => (
          <button key={view} type="button" className="home-tile" onClick={() => onNavigate(view)}>
            <span className="home-tile-icon">
              <Icon size={22} />
            </span>
            <span className="home-tile-title">{title}</span>
            <span className="home-tile-tagline">{tagline}</span>
            <span className="home-tile-description">{description}</span>
            <span className="home-tile-cta">
              Open
              <ChevronRightIcon size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
