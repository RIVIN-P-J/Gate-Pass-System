import React, { createContext, useContext } from 'react'

const TabsContext = createContext({
  value: '',
  onValueChange: () => {},
})

const Tabs = ({ value, onValueChange, children, className = '', ...props }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 ${className}`}
    {...props}
  >
    {children}
  </div>
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef(({ value, className = '', children, ...props }, ref) => {
  const context = useContext(TabsContext)
  const isActive = context.value === value

  return (
    <button
      ref={ref}
      onClick={() => context.onValueChange(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = ({ value, className = '', children, ...props }) => {
  const context = useContext(TabsContext)
  const isActive = context.value === value

  if (!isActive) return null

  return (
    <div
      className={`mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
