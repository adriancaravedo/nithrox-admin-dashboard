import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'
const badgeVariants = cva('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors', {
  variants: {
    variant: {
      default: 'border-transparent bg-primary text-primary-foreground shadow',
      secondary: 'border-transparent bg-secondary text-secondary-foreground',
      destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
      outline: 'text-foreground',
      success: 'border-transparent bg-green-100 text-green-700',
      warning: 'border-transparent bg-yellow-100 text-yellow-700',
      info: 'border-transparent bg-blue-100 text-blue-700',
      purple: 'border-transparent bg-purple-100 text-purple-700',
    },
  },
  defaultVariants: { variant: 'default' },
})
function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
export { Badge, badgeVariants }
