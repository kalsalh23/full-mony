import { forwardRef } from 'react'

const Card = forwardRef(({
  children,
  className = '',
  hover = false,
  padding = 'none',
  ...props
}, ref) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  }

  return (
    <div
      ref={ref}
      className={`card ${hover ? 'card-hover' : ''} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

const CardHeader = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div ref={ref} className={`card-header ${className}`} {...props}>
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

const CardBody = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div ref={ref} className={`card-body ${className}`} {...props}>
    {children}
  </div>
))

CardBody.displayName = 'CardBody'

const CardFooter = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => (
  <div ref={ref} className={`px-6 py-4 border-t border-slate-100 ${className}`} {...props}>
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardBody, CardFooter }