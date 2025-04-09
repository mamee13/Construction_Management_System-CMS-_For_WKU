// src/utils/dateUtils.js

/**
 * Formats an ISO date string or Date object into a more readable format.
 *
 * @param {string | Date | null | undefined} dateInput - The date string or Date object to format.
 * @param {Intl.DateTimeFormatOptions} options - Optional formatting options (e.g., { month: 'long' }).
 * @returns {string} - The formatted date string, or 'N/A' if the input is invalid or null/undefined.
 */
export const formatDate = (dateInput, options = {}) => {
    // Return 'N/A' for null, undefined, or empty string inputs
    if (!dateInput) {
      return 'N/A';
    }
  
    try {
      const date = new Date(dateInput);
  
      // Check if the date object is valid after parsing
      if (isNaN(date.getTime())) {
        console.warn("formatDate received an invalid date input:", dateInput);
        return 'Invalid Date';
      }
  
      // Define default formatting options
      const defaultOptions = {
        year: 'numeric', // e.g., 2023
        month: 'short',  // e.g., Sep
        day: 'numeric',  // e.g., 15
        // You can add time options if needed:
        // hour: '2-digit',
        // minute: '2-digit',
        ...options, // Merge any custom options passed in
      };
  
      // Use toLocaleDateString for locale-aware formatting
      return date.toLocaleDateString(undefined, defaultOptions);
      // 'undefined' uses the browser's default locale, or you can specify one like 'en-US'
  
    } catch (error) {
      console.error("Error formatting date:", dateInput, error);
      return 'Invalid Date'; // Return an error indicator
    }
  };
  
  // You can add other date-related utility functions here if needed
  // export const calculateDaysDifference = (date1, date2) => { ... };