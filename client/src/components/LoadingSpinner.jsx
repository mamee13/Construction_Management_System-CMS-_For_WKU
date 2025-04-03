const LoadingSpinner = ({ size = "medium", message = "Loading..." }) => {
    // Size classes
    const sizeClasses = {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12",
    }
  
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`animate-spin rounded-full border-t-2 border-b-2 border-indigo-500 ${sizeClasses[size]}`}></div>
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    )
  }
  
  export default LoadingSpinner
  
  