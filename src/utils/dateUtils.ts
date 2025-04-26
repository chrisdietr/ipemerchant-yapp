import { format, parseISO, fromUnixTime } from 'date-fns';

/**
 * Formats a date string into a readable date format.
 * Handles various date formats and gracefully fails if invalid.
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) {
    return 'Date not available';
  }
  
  try {
    // Try to parse as ISO date first
    const isoDate = parseISO(dateString);
    if (!isNaN(isoDate.getTime())) {
      return format(isoDate, 'PPP');
    }
    
    // Try as unix timestamp in seconds (10 digits)
    if (/^\d{10}$/.test(dateString)) {
      const unixDate = fromUnixTime(parseInt(dateString, 10));
      if (!isNaN(unixDate.getTime())) {
        return format(unixDate, 'PPP');
      }
    }
    
    // Try as unix timestamp in milliseconds (13 digits)
    if (/^\d{13}$/.test(dateString)) {
      const msDate = new Date(parseInt(dateString, 10));
      if (!isNaN(msDate.getTime())) {
        return format(msDate, 'PPP');
      }
    }
    
    // Try as number (any format)
    const numDate = new Date(Number(dateString));
    if (!isNaN(numDate.getTime())) {
      return format(numDate, 'PPP');
    }
    
    // Try as regular date string
    const regDate = new Date(dateString);
    if (!isNaN(regDate.getTime())) {
      return format(regDate, 'PPP');
    }
    
    return 'Date not available';
  } catch (err) {
    return 'Date not available';
  }
};

/**
 * Formats a date string into a readable time format.
 * Handles various date formats and gracefully fails if invalid.
 * @param dateString The date string to format
 * @param use24Hour Whether to use 24-hour format (true) or AM/PM (false)
 */
export const formatTime = (dateString?: string, use24Hour = false): string => {
  if (!dateString) {
    return 'Time not available';
  }
  
  const timeFormat = use24Hour ? 'HH:mm' : 'p';
  
  try {
    // Try to parse as ISO date first
    const isoDate = parseISO(dateString);
    if (!isNaN(isoDate.getTime())) {
      return format(isoDate, timeFormat);
    }
    
    // Try as unix timestamp in seconds (10 digits)
    if (/^\d{10}$/.test(dateString)) {
      const unixDate = fromUnixTime(parseInt(dateString, 10));
      if (!isNaN(unixDate.getTime())) {
        return format(unixDate, timeFormat);
      }
    }
    
    // Try as unix timestamp in milliseconds (13 digits)
    if (/^\d{13}$/.test(dateString)) {
      const msDate = new Date(parseInt(dateString, 10));
      if (!isNaN(msDate.getTime())) {
        return format(msDate, timeFormat);
      }
    }
    
    // Try as number (any format)
    const numDate = new Date(Number(dateString));
    if (!isNaN(numDate.getTime())) {
      return format(numDate, timeFormat);
    }
    
    // Try as regular date string
    const regDate = new Date(dateString);
    if (!isNaN(regDate.getTime())) {
      return format(regDate, timeFormat);
    }
    
    return 'Time not available';
  } catch (err) {
    return 'Time not available';
  }
};

/**
 * Fetches transaction details from the Yodl API.
 * @param txHash The transaction hash
 * @param addLog An optional function to log debug information
 */
export const fetchTransactionDetails = async (
  txHash: string, 
  addLog?: (message: string) => void
): Promise<any | null> => {
  try {
    if (addLog) addLog(`Fetching details for ${txHash}`);
    
    const response = await fetch(`https://tx.yodl.me/api/v1/payments/${txHash}`);
    
    if (!response.ok) {
      if (addLog) addLog(`Failed with status ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (addLog) {
      const truncatedData = JSON.stringify(data).substring(0, 100) + '...';
      addLog(`Response for ${txHash}: ${truncatedData}`);
      
      // Log specific fields if they exist
      if (data?.payment?.blockTimestamp) {
        addLog(`Found blockTimestamp: ${data.payment.blockTimestamp}`);
      }
      
      if (data?.payment?.payerAddress) {
        addLog(`Found payerAddress: ${data.payment.payerAddress}`);
      }
    }
    
    return data;
  } catch (error) {
    if (addLog) addLog(`Error fetching transaction ${txHash}: ${error}`);
    return null;
  }
}; 