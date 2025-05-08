import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  documentId,
} from "firebase/firestore";
import { db } from "../../../configs/firebase";
import { getMonthName, getWeekOfMonth } from "../utils/dateUtils";

// This hook helps us keep track of all the money a business has made
// It organizes transactions by month and week, so we can show nice charts
export const useTransactionData = (currentBusinessId) => {
  // Keep track of all the transaction data we've processed
  const [transactionData, setTransactionData] = useState({});
  // Let the UI know when we're still loading data
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  // The total amount of money made across all time
  const [overallTotalEarnings, setOverallTotalEarnings] = useState(0);

  // This function takes raw delivery history and turns it into nice, organized data
  // It groups everything by month and week, and calculates earnings
  const processTransactionData = (
    historyItems,
    deliveryIdToRequestIdMap,
    requestIdToCostMap
  ) => {
    // We'll store all our organized data here
    const monthlyAggregates = {};

    // Go through each delivery in the history
    historyItems.forEach((item) => {
      // Skip if we don't have a valid delivery time
      if (
        !item.deliveryArrivalTime ||
        typeof item.deliveryArrivalTime.toDate !== "function"
      ) {
        console.warn(
          "Skipping history item due to invalid deliveryArrivalTime:",
          item
        );
        return;
      }

      // Figure out when this delivery happened
      const timestamp = item.deliveryArrivalTime.toDate();
      const year = timestamp.getFullYear();
      const monthIndex = timestamp.getMonth();
      const monthName = getMonthName(monthIndex);
      const weekNumber = getWeekOfMonth(timestamp);
      const weekKey = `Week ${weekNumber}`;
      const monthYearKey = `${monthName} ${year}`;

      // Find out how much this delivery cost
      const requestId = deliveryIdToRequestIdMap.get(item.deliveryId);
      let cost = 0;
      if (requestId) {
        const rawCost = requestIdToCostMap.get(requestId);
        if (typeof rawCost === "string") {
          cost = parseFloat(rawCost) || 0;
        } else if (typeof rawCost === "number") {
          cost = rawCost;
        }
      }

      // Create a new month if we haven't seen it before
      if (!monthlyAggregates[monthYearKey]) {
        monthlyAggregates[monthYearKey] = {};
      }
      // Create a new week if we haven't seen it before
      if (!monthlyAggregates[monthYearKey][weekKey]) {
        monthlyAggregates[monthYearKey][weekKey] = {
          transactions: 0,
          earnings: 0,
        };
      }
      // Add this delivery to our totals
      monthlyAggregates[monthYearKey][weekKey].transactions++;
      monthlyAggregates[monthYearKey][weekKey].earnings += cost;
    });

    // Turn our organized data into a format that's easy to display
    return formatTransactionData(monthlyAggregates);
  };

  // This function makes our data look nice for the charts
  const formatTransactionData = (monthlyAggregates) => {
    const formattedData = {};
    // Sort months from oldest to newest
    Object.keys(monthlyAggregates)
      .sort((a, b) => {
        const [monthA, yearA] = a.split(" ");
        const [monthB, yearB] = b.split(" ");
        const dateA = new Date(`${monthA} 1, ${yearA}`);
        const dateB = new Date(`${monthB} 1, ${yearB}`);
        return dateA - dateB;
      })
      .forEach((monthYearKey) => {
        const weeklyData = monthlyAggregates[monthYearKey];
        // Create entries for the chart, sorted by week
        const chartEntriesForMonth = Object.keys(weeklyData)
          .map((weekKey) => ({
            week: weekKey,
            transactions: weeklyData[weekKey].transactions,
          }))
          .sort(
            (a, b) =>
              parseInt(a.week.split(" ")[1]) - parseInt(b.week.split(" ")[1])
          );

        // Calculate totals for the whole month
        const monthTotalTransactions = Object.values(weeklyData).reduce(
          (sum, week) => sum + week.transactions,
          0
        );
        const monthTotalEarnings = Object.values(weeklyData).reduce(
          (sum, week) => sum + week.earnings,
          0
        );

        // Save everything in a nice format
        formattedData[monthYearKey] = {
          chartEntries: chartEntriesForMonth,
          monthTotalTransactions,
          monthTotalEarnings,
        };
      });
    return formattedData;
  };

  // This effect runs whenever the business ID changes
  useEffect(() => {
    // If we don't have a business ID, clear everything
    if (!currentBusinessId) {
      setLoadingTransactions(false);
      setTransactionData({});
      setOverallTotalEarnings(0);
      return;
    }

    // Start loading
    setLoadingTransactions(true);
    const historyQuery = collection(db, "deliveryHistory");

    // Listen for changes to the delivery history
    const unsubscribeHistory = onSnapshot(
      historyQuery,
      async (historySnapshot) => {
        try {
          // Get all the delivery history
          const deliveryHistories = historySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Make sure we only look at valid deliveries
          const validHistories = deliveryHistories.filter(
            (h) =>
              h.deliveryId &&
              h.deliveryArrivalTime &&
              h.deliveryArrivalTime.toDate
          );

          // If there's no valid history, clear everything
          if (validHistories.length === 0) {
            setTransactionData({});
            setOverallTotalEarnings(0);
            setLoadingTransactions(false);
            return;
          }

          // Get all the delivery and hauler info we need
          const { deliveryMap, haulerMap } = await fetchDeliveryAndHaulerData(
            validHistories
          );
          // Only look at deliveries for this business
          const businessHistoryItems = filterBusinessHistory(
            validHistories,
            deliveryMap,
            haulerMap,
            currentBusinessId
          );

          // If this business has no history, clear everything
          if (businessHistoryItems.length === 0) {
            setTransactionData({});
            setOverallTotalEarnings(0);
            setLoadingTransactions(false);
            return;
          }

          // Get all the request info we need
          const { deliveryIdToRequestIdMap, requestIdToCostMap } =
            await fetchRequestData(businessHistoryItems, deliveryMap);
          // Process all the data
          const processedData = processTransactionData(
            businessHistoryItems,
            deliveryIdToRequestIdMap,
            requestIdToCostMap
          );

          // Save everything
          setTransactionData(processedData);
          setOverallTotalEarnings(calculateOverallEarnings(processedData));
          setLoadingTransactions(false);
        } catch (error) {
          // If something goes wrong, clear everything
          console.error("Error processing transaction data:", error);
          setLoadingTransactions(false);
          setTransactionData({});
          setOverallTotalEarnings(0);
        }
      }
    );

    // Clean up when we're done
    return () => unsubscribeHistory();
  }, [currentBusinessId]);

  // Give back all the data we've processed
  return {
    transactionData,
    loadingTransactions,
    overallTotalEarnings,
  };
};

// Helper function to get delivery and hauler info
const fetchDeliveryAndHaulerData = async (validHistories) => {
  // Get all the unique delivery IDs
  const deliveryDocIdsFromHistory = [
    ...new Set(validHistories.map((item) => item.deliveryId)),
  ];
  // Get all the delivery documents
  const deliveryDocsSnap = await Promise.all(
    deliveryDocIdsFromHistory.map((id) => getDoc(doc(db, "deliveries", id)))
  );

  // Process the delivery data
  const deliveries = deliveryDocsSnap
    .filter((snap) => snap.exists())
    .map((snap) => ({ id: snap.id, ...snap.data() }));
  const deliveryMap = new Map(deliveries.map((d) => [d.id, d]));

  // Get all the unique hauler IDs
  const haulerIds = [
    ...new Set(deliveries.map((d) => d.haulerAssignedId).filter(Boolean)),
  ];
  const haulerMap = new Map();

  // Get all the hauler documents
  if (haulerIds.length > 0) {
    const haulerQueryPromises = [];
    // Firestore can only handle 30 IDs at a time, so we split them up
    for (let i = 0; i < haulerIds.length; i += 30) {
      const batch = haulerIds.slice(i, i + 30);
      haulerQueryPromises.push(
        getDocs(query(collection(db, "users"), where("userId", "in", batch)))
      );
    }
    const haulerSnapshots = await Promise.all(haulerQueryPromises);
    haulerSnapshots.forEach((snap) =>
      snap.docs.forEach((d) => haulerMap.set(d.data().userId, d.data()))
    );
  }

  return { deliveryMap, haulerMap };
};

// Helper function to filter deliveries for a specific business
const filterBusinessHistory = (
  validHistories,
  deliveryMap,
  haulerMap,
  currentBusinessId
) => {
  return validHistories.filter((history) => {
    const delivery = deliveryMap.get(history.deliveryId);
    if (!delivery || !delivery.haulerAssignedId) return false;
    const hauler = haulerMap.get(delivery.haulerAssignedId);
    return hauler && hauler.businessId === currentBusinessId;
  });
};

// Helper function to get request data
const fetchRequestData = async (businessHistoryItems, deliveryMap) => {
  const requestIdsToFetch = [];
  const deliveryIdToRequestIdMap = new Map();

  // Get all the request IDs we need
  businessHistoryItems.forEach((hItem) => {
    const delivery = deliveryMap.get(hItem.deliveryId);
    if (delivery && delivery.requestId) {
      requestIdsToFetch.push(delivery.requestId);
      deliveryIdToRequestIdMap.set(hItem.deliveryId, delivery.requestId);
    }
  });

  const uniqueRequestIds = [...new Set(requestIdsToFetch)];
  const requestIdToCostMap = new Map();

  // Get all the request documents
  if (uniqueRequestIds.length > 0) {
    const requestPromises = [];
    // Firestore can only handle 30 IDs at a time, so we split them up
    for (let i = 0; i < uniqueRequestIds.length; i += 30) {
      const batchIds = uniqueRequestIds.slice(i, i + 30);
      requestPromises.push(
        getDocs(
          query(
            collection(db, "deliveryRequests"),
            where(documentId(), "in", batchIds)
          )
        )
      );
    }
    const requestSnapshots = await Promise.all(requestPromises);
    requestSnapshots.forEach((snapshot) => {
      snapshot.docs.forEach((d) => {
        requestIdToCostMap.set(d.id, d.data().estimatedCost);
      });
    });
  }

  return { deliveryIdToRequestIdMap, requestIdToCostMap };
};

// Helper function to calculate total earnings
const calculateOverallEarnings = (processedData) => {
  return Object.values(processedData).reduce(
    (total, monthData) => total + (monthData.monthTotalEarnings || 0),
    0
  );
};
