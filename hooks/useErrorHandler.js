// hooks/useErrorHandler.js - Custom hook for error handling
import { useState, useCallback } from 'react'
import { getErrorMessage, logError } from '../utils/errorHandler'

export const useErrorHandler = () => {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error, context = {}) => {
    const errorMessage = getErrorMessage(error)
    logError(error, context)
    setError(errorMessage)
    return errorMessage
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeWithErrorHandling = useCallback(async (asyncOperation, context = {}) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await asyncOperation()
      setIsLoading(false)
      return result
    } catch (error) {
      setIsLoading(false)
      handleError(error, context)
      throw error
    }
  }, [handleError])

  return {
    error,
    isLoading,
    handleError,
    clearError,
    executeWithErrorHandling
  }
}

export default useErrorHandler