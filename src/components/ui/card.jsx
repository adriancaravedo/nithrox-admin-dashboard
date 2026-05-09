import { cn } from '../../lib/utils'
const Card = ({ className, ...props }) => <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />
const CardHeader = ({ className, ...props }) => <div className={cn('flex flex-col space-y-1.5 p-5', className)} {...props} />
const CardTitle = ({ className, ...props }) => <div className={cn('font-semibold leading-none tracking-tight text-sm', className)} {...props} />
const CardDescription = ({ className, ...props }) => <div className={cn('text-xs text-muted-foreground', className)} {...props} />
const CardContent = ({ className, ...props }) => <div className={cn('p-5 pt-0', className)} {...props} />
const CardFooter = ({ className, ...props }) => <div className={cn('flex items-center p-5 pt-0', className)} {...props} />
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
