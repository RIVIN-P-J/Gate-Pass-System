import React from 'react'

const Alert = React.forwardRef(({ className, variant = 'default', ...props }, ref) => {
  const variantClasses = {
    default: "border-gray-200 bg-white text-gray-950",
    destructive: "border-red-200 bg-red-50 text-red-900",
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${variantClasses[variant]} ${className || ''}`}
      {...props}
    />
  )
})
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`text-sm ${className || ''}`}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
