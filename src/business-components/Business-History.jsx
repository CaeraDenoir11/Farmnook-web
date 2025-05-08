import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../configs/firebase";

export default function History() {
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  const getReadableLocation = async (coords) => {
    if (!coords) return "No location";
    const [lat, lng] = coords.split(",");
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=9b332265c5664a9984191710ac38cc4a`
      );
      const data = await response.json();
      return data.results?.[0]?.formatted || "Unknown location";
    } catch {
      return "Unknown location";
    }
  };

  useEffect(() => {
    const currentUserId = localStorage.getItem("userId");

    const unsubscribe = onSnapshot(
      collection(db, "deliveryHistory"),
      async (snapshot) => {
        setIsLoading(true);

        if (snapshot.empty) {
          setHistoryData([]);
          setIsLoading(false);
          return;
        }

        const deliveryHistories = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const deliveryIds = deliveryHistories
          .map((item) => item.deliveryId)
          .filter(Boolean);

        const deliverySnapshots = await Promise.all(
          deliveryIds.map((id) => getDoc(doc(db, "deliveries", id)))
        );

        const deliveries = deliverySnapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));

        const haulerIds = [
          ...new Set(deliveries.map((d) => d.haulerAssignedId).filter(Boolean)),
        ];
        const requestIds = deliveries.map((d) => d.requestId).filter(Boolean);

        const haulerMap = haulerIds.length
          ? Object.fromEntries(
              (
                await getDocs(
                  query(
                    collection(db, "users"),
                    where("userId", "in", haulerIds)
                  )
                )
              ).docs.map((d) => [d.data().userId, d.data()])
            )
          : {};

        const requestSnapshots = await Promise.all(
          requestIds.map((id) => getDoc(doc(db, "deliveryRequests", id)))
        );

        const requests = requestSnapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ id: snap.id, ...snap.data() }));

        const farmerIds = [
          ...new Set(requests.map((r) => r.farmerId).filter(Boolean)),
        ];

        const farmerMap = farmerIds.length
          ? Object.fromEntries(
              (
                await getDocs(
                  query(
                    collection(db, "users"),
                    where("userId", "in", farmerIds)
                  )
                )
              ).docs.map((d) => [d.data().userId, d.data()])
            )
          : {};

        const vehicleIds = [
          ...new Set(requests.map((r) => r.vehicleId).filter(Boolean)),
        ];

        const vehicleMap = vehicleIds.length
          ? Object.fromEntries(
              (
                await getDocs(
                  query(
                    collection(db, "vehicles"),
                    where("__name__", "in", vehicleIds)
                  )
                )
              ).docs.map((d) => [d.id, d.data()])
            )
          : {};

        const mergedHistory = deliveryHistories
          .map((history) => {
            const delivery = deliveries.find(
              (d) => d.id === history.deliveryId
            );
            if (!delivery) return null;

            const hauler = haulerMap[delivery.haulerAssignedId];
            if (!hauler || hauler.businessId !== currentUserId) return null;

            const request = requests.find((r) => r.id === delivery.requestId);
            if (!request) return null;

            const farmer = farmerMap[request.farmerId] || {};
            const vehicle = vehicleMap[request.vehicleId] || {};

            const deliveryArrivalTime = history.deliveryArrivalTime;
            const formattedArrivalTime =
              deliveryArrivalTime?.toDate?.().toLocaleString() ||
              "No arrival time";
            const dateObject = deliveryArrivalTime?.toDate?.() || new Date(0);

            return {
              id: history.id,
              vehicleType: vehicle.vehicleType || "Unknown",
              haulerName: `${hauler.firstName} ${hauler.lastName}`,
              farmerName:
                `${farmer.firstName || ""} ${farmer.lastName || ""}`.trim() ||
                "Unknown Farmer",
              weight: request.weight,
              productType: request.productType,
              purpose:
                request.purpose?.charAt(0).toUpperCase() +
                request.purpose?.slice(1),
              timestamp: formattedArrivalTime,
              timestampRaw: dateObject,
              estimatedCost: request.estimatedCost,
              pickupName: request.pickupName,
              destinationName: request.destinationName,
              pickupLocation: request.pickupLocation,
              destinationLocation: request.destinationLocation,
            };
          })
          .filter(Boolean);

        mergedHistory.sort((a, b) => b.timestampRaw - a.timestampRaw);
        setHistoryData(mergedHistory);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredHistory = historyData.filter((entry) => {
    const query = searchQuery.toLowerCase();
    const queryMatch =
      (entry.farmerName?.toLowerCase() || "").includes(query) ||
      (entry.haulerName?.toLowerCase() || "").includes(query) ||
      (entry.vehicleType?.toLowerCase() || "").includes(query);

    const fromDate = dateRange.from ? new Date(dateRange.from) : null;
    const toDate = dateRange.to ? new Date(dateRange.to) : null;

    const inRange =
      (!fromDate || entry.timestampRaw >= fromDate) &&
      (!toDate || entry.timestampRaw <= toDate);

    return queryMatch && inRange;
  });

  return (
    <div className="antialiased bg-white flex flex-col items-center min-h-screen">
      <div className="container mx-auto px-4 sm:px-8">
        <div className="py-8">
          <h1 className="text-2xl font-semibold text-[#1A4D2E] mb-4 px-8">
            Delivery History
          </h1>
          <div className="my-4 flex items-center gap-4 w-full">
            <div className="flex gap-2">
              <input
                type="date"
                className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent transition-colors duration-200"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, from: e.target.value }))
                }
              />
              <input
                type="date"
                className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent transition-colors duration-200"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, to: e.target.value }))
                }
              />
            </div>
            <input
              type="text"
              placeholder="Search by Farmer, Hauler, or Vehicle Used"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A4D2E] focus:border-transparent transition-colors duration-200"
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A4D2E]"></div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <p className="text-center text-gray-600">
              No delivery history found.
            </p>
          ) : (
            <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
              <div className="inline-block min-w-full shadow-lg rounded-lg overflow-hidden">
                <table className="min-w-full leading-normal">
                  <thead>
                    <tr className="bg-[#F5EFE6] text-[#1A4D2E] uppercase text-xs font-semibold tracking-wider">
                      <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                        Farmer Name
                      </th>
                      <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                        Hauler Assigned
                      </th>
                      <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                        Vehicle Used
                      </th>
                      <th className="px-5 py-4 border-b-2 border-[#1A4D2E]/20 text-left">
                        Date Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((entry) => (
                      <tr
                        key={entry.id}
                        className="bg-white hover:bg-[#F5EFE6]/50 transition-colors duration-200 cursor-pointer"
                        onClick={async () => {
                          const pickup = await getReadableLocation(
                            entry.pickupLocation
                          );
                          const drop = await getReadableLocation(
                            entry.destinationLocation
                          );

                          setSelectedEntry({
                            ...entry,
                            pickupLocation: pickup,
                            destinationLocation: drop,
                          });
                        }}
                      >
                        <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                          {entry.farmerName}
                        </td>
                        <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                          {entry.haulerName}
                        </td>
                        <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                          {entry.vehicleType}
                        </td>
                        <td className="px-5 py-5 border-b border-[#1A4D2E]/10 text-[#1A4D2E]">
                          {entry.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-3 py-3 bg-white flex flex-col xs:flex-row items-center xs:justify-between border-t border-[#1A4D2E]/10">
                  <span className="text-xs xs:text-sm text-gray-900">
                    Showing {filteredHistory.length} Entries
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEntry && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/40 z-50">
          <div className="bg-[#F5EFE6] p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
            <button
              onClick={() => setSelectedEntry(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-colors duration-200 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-2xl font-bold text-[#1A4D2E] text-center mb-6">
              Delivery Details
            </h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>
                <strong>Delivery ID:</strong> {selectedEntry.id}
              </li>
              <li>
                <strong>Hauler Assigned:</strong> {selectedEntry.haulerName}
              </li>
              <li>
                <strong>Farmer Name:</strong> {selectedEntry.farmerName}
              </li>
              <li>
                <strong>Vehicle Type:</strong> {selectedEntry.vehicleType}
              </li>
              <li>
                <strong>Product Type:</strong> {selectedEntry.productType}
              </li>
              <li>
                <strong>Purpose:</strong> {selectedEntry.purpose}
              </li>
              <li>
                <strong>Weight:</strong> {selectedEntry.weight} KG
              </li>
              <li>
                <strong>Cost:</strong> {selectedEntry.estimatedCost}
              </li>
              <li>
                <strong>Date Completed:</strong> {selectedEntry.timestamp}
              </li>
              <li>
                <strong>Pickup Location:</strong> {selectedEntry.pickupName}
              </li>
              <li>
                <strong>Destination Location:</strong>{" "}
                {selectedEntry.destinationName}
              </li>
            </ul>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-[#1A4D2E] text-white rounded-lg hover:bg-[#145C38] transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
