import {useMemo} from "react";
import {motion} from "framer-motion";
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";

// Helper to format currency (e.g., PHP)
const formatCurrency = (value) => {
	// Adjust 'en-PH' and 'PHP' as per your application's currency and locale needs
	return new Intl.NumberFormat("en-PH", {
		style: "currency",
		currency: "PHP",
	}).format(value || 0);
};

export default function MonthlyTransactionsCard({
	selectedMonth,
	setSelectedMonth,
	transactionData, // Now { "Month Year": { chartEntries: [], monthTotalTransactions: X, monthTotalEarnings: Y } }
	isLoading,
	overallTotalEarnings, // New prop
}) {
	// Get data for the currently selected month
	const currentMonthData = useMemo(() => {
		return transactionData?.[selectedMonth];
	}, [selectedMonth, transactionData]);

	// Data for the chart (weekly transaction counts)
	const chartData = useMemo(() => {
		return currentMonthData?.chartEntries || [];
	}, [currentMonthData]);

	// Total transactions for the selected month
	const totalMonthlyTransactions = useMemo(() => {
		return currentMonthData?.monthTotalTransactions || 0;
	}, [currentMonthData]);

	// Total earnings for the selected month
	const totalMonthlyEarnings = useMemo(() => {
		return currentMonthData?.monthTotalEarnings || 0;
	}, [currentMonthData]);

	// Get available months from the transaction data keys
	const availableMonths = useMemo(
		() => Object.keys(transactionData || {}),
		[transactionData]
	);

	return (
		<div className="bg-white p-6 rounded-2xl shadow-lg h-full flex flex-col">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold text-[#1A4D2E]">Monthly Activity</h2>
				{availableMonths.length > 0 ? (
					<select
						className="p-2 border rounded-lg bg-[#FCFFE0] text-[#1A4D2E] cursor-pointer"
						value={selectedMonth}
						onChange={(e) => setSelectedMonth(e.target.value)}
						disabled={isLoading}
					>
						{availableMonths.map((month) => (
							<option className="cursor-pointer" key={month} value={month}>
								{month}
							</option>
						))}
					</select>
				) : (
					!isLoading && (
						<span className="text-sm text-gray-500 cursor-pointer">
							No data available
						</span>
					)
				)}
			</div>

			{/* Display Monthly Totals */}
			<div className="mb-4 text-center space-y-1">
				<motion.p
					key={`${selectedMonth}-transactions-${totalMonthlyTransactions}`}
					className="text-lg font-semibold text-[#1A4D2E]"
					initial={{opacity: 0, y: -10}}
					animate={{opacity: 1, y: 0}}
					transition={{duration: 0.4}}
				>
					Transactions: {isLoading ? "..." : totalMonthlyTransactions}
				</motion.p>
				<motion.p
					key={`${selectedMonth}-earnings-${totalMonthlyEarnings}`}
					className="text-lg font-semibold text-[#1A4D2E]"
					initial={{opacity: 0, y: -10}}
					animate={{opacity: 1, y: 0}}
					transition={{duration: 0.4, delay: 0.1}}
				>
					Earnings for {selectedMonth}:{" "}
					{isLoading ? "..." : formatCurrency(totalMonthlyEarnings)}
				</motion.p>
			</div>

			{/* Chart Area */}
			<div className="flex-1 min-h-[280px] w-full bg-[#FCFFE0] p-4 rounded-lg relative">
				{isLoading ? (
					<div className="absolute inset-0 flex justify-center items-center bg-[#FCFFE0]/50">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A4D2E]"></div>
					</div>
				) : chartData.length === 0 ? (
					<div className="absolute inset-0 flex justify-center items-center">
						<p className="text-gray-500">
							No transactions for {selectedMonth}.
						</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart
							data={chartData}
							margin={{top: 20, right: 30, left: 0, bottom: 10}}
						>
							<defs>
								<linearGradient
									id="colorTransactions"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop offset="5%" stopColor="#1A4D2E" stopOpacity={0.8} />
									<stop offset="95%" stopColor="#F5EFE6" stopOpacity={0.1} />
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								strokeOpacity={0.2}
								stroke="#1A4D2E"
							/>
							<XAxis
								dataKey="week"
								tick={{fill: "#1A4D2E", fontSize: 12}}
								tickLine={{stroke: "#1A4D2E"}}
								axisLine={{stroke: "#1A4D2E"}}
							/>
							<YAxis
								allowDecimals={false}
								tick={{fill: "#1A4D2E", fontSize: 12}}
								tickLine={{stroke: "#1A4D2E"}}
								axisLine={{stroke: "#1A4D2E"}}
							/>
							<Tooltip
								cursor={{fill: "rgba(26, 77, 46, 0.1)"}}
								contentStyle={{
									backgroundColor: "white",
									border: "1px solid #1A4D2E",
									borderRadius: "8px",
									color: "#1A4D2E",
									fontSize: "14px",
								}}
								formatter={(value, name, props) => {
									// props.payload will contain the full data point e.g. { week: "Week 1", transactions: 10 }
									// If you added weeklyEarnings to chartData, you could display it here too.
									return [`${value} Transactions`, null];
								}}
							/>
							<Area
								type="monotone"
								dataKey="transactions" // Chart still plots transaction counts
								stroke="#1A4D2E"
								strokeWidth={2}
								fillOpacity={1}
								fill="url(#colorTransactions)"
								activeDot={{
									r: 6,
									fill: "#1A4D2E",
									stroke: "white",
									strokeWidth: 2,
								}}
								animationDuration={500}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</div>

			{/* Overall Total Earnings */}
			<div className="mt-6 pt-4 border-t border-gray-200 text-center">
				<motion.p
					key={`overall-earnings-${overallTotalEarnings}`}
					className="text-xl font-bold text-[#1A4D2E]"
					initial={{opacity: 0}}
					animate={{opacity: 1}}
					transition={{duration: 0.5, delay: 0.2}}
				>
					Overall Total Earnings:{" "}
					{isLoading && overallTotalEarnings === 0
						? "..."
						: formatCurrency(overallTotalEarnings)}
				</motion.p>
			</div>
		</div>
	);
}
