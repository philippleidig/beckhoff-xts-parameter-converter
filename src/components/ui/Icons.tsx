export {
  Upload as UploadIcon,
  RotateCcw as ResetIcon,
  ChevronRight as ChevronRightIcon,
  ChevronDown as ChevronDownIcon,
  ArrowRight as ArrowRightIcon,
  FileText as FileIcon,
  FileCode as FileXtiIcon,
  AlertCircle as AlertIcon,
  AlertTriangle as WarningIcon,
  Info as InfoIcon,
  Lightbulb as TipIcon,
  ExternalLink as ExternalLinkIcon,
  Settings as SettingsIcon,
  MessageSquarePlus as FeedbackIcon,
  Download as DownloadIcon,
  HelpCircle as HelpIcon,
  X as CloseIcon,
  Check as CheckIcon,
  Sliders as SlidersIcon,
  Layers as LayersIcon,
  CircuitBoard as MagnetPlateIcon,
  GitCompare as CompareIcon,
  Wand2 as ConvertIcon,
  FilePlus2 as CreateIcon,
  GraduationCap as TutorialIcon,
  ArrowLeft as BackIcon,
} from 'lucide-react'

interface IconProps {
  size?: number
  className?: string
}

/**
 * lucide dropped its brand icons in v1, so the GitHub mark is drawn here. It takes the
 * same `size`/`className` props as the lucide icons around it, but is a filled path
 * rather than a stroked one.
 */
export function GithubIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.79 1.07.79 2.15v3.19c0 .3.2.66.79.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}
