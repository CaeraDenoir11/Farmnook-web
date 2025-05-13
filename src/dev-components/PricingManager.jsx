import React, { useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../configs/firebase.js'; // Adjust the path to your firebase config

const PricingRulesManager = () => {
  const [pricingData, setPricingData] = useState({}); // Original data from Firestore
  const [editingData, setEditingData] = useState({}); // Data being displayed/edited on the page
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItemForEdit, setCurrentItemForEdit] = useState(null); // { vehicleType: '...', rules: {...} }
  const [modalEditingData, setModalEditingData] = useState({}); // Holds changes for the modal item's rules

  const documentId = 'ZTuDQiNR2KbFH0S2g6qV'; // Replace with your actual document ID

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'pricing_rules', documentId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPricingData(data);
        setEditingData(data); // Initialize editingData with fetched data
      } else {
        console.log("No such document!");
        setPricingData({});
        setEditingData({});
      }
    });
    return () => unsub();
  }, [documentId]); // Added documentId to dependency array

  // --- Modal Handlers ---
  const handleOpenModal = (vehicleType, rules) => {
    setCurrentItemForEdit({ vehicleType, rules });
    setModalEditingData({ ...rules }); // Crucial: Copy rules to modal-specific state
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItemForEdit(null);
    setModalEditingData({});
  };

  const handleModalInputChange = (field, value) => {
    setModalEditingData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0, // Ensure it's a number, default to 0 if NaN
    }));
  };

  const handleModalSave = async () => {
    if (!currentItemForEdit) return;
    setIsSaving(true);

    // Prepare the full updated data object for Firestore
    const updatedFullData = {
      ...editingData,
      [currentItemForEdit.vehicleType]: {
        ...editingData[currentItemForEdit.vehicleType], // Keep other potential properties if any
        ...modalEditingData, // Apply modal changes
      },
    };

    try {
      await updateDoc(doc(db, 'pricing_rules', documentId), updatedFullData);
      // If Firestore update is successful, then update local state
      setEditingData(updatedFullData); // This will re-render the table with new values
      alert('Pricing rule updated successfully!');
      handleCloseModal();
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      alert('Failed to update.');
    }
    setIsSaving(false);
  };

  // --- Global Save Handler (if you still want a main save button) ---
  // This will save ALL data in editingData to Firestore.
  // If modal saves immediately, this might be for other non-modal changes or just a final "sync"
  const handleGlobalSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'pricing_rules', documentId), editingData);
      alert('All pricing rules updated successfully!');
    } catch (error) {
      console.error('Error updating all pricing rules:', error);
      alert('Failed to update all rules.');
    }
    setIsSaving(false);
  };


  // Dynamically get rule fields for table headers, ensuring they are sorted for consistency
  const ruleFields = useMemo(() => {
    if (Object.keys(editingData).length === 0) return [];
    const firstVehicleType = Object.keys(editingData)[0];
    if (editingData[firstVehicleType]) {
      return Object.keys(editingData[firstVehicleType]).sort();
    }
    return [];
  }, [editingData]);

  const sortedVehicleTypes = useMemo(() => {
    return Object.entries(editingData).sort(([a], [b]) => a.localeCompare(b));
  }, [editingData]);


  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#1A4D2E]">
        Pricing Rules Manager
      </h1>

      {/* Table Display */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                Vehicle Type
              </th>
              {ruleFields.map((field) => (
                <th
                  key={field}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider capitalize"
                >
                  {field.replace(/_/g, ' ')}
                </th>
              ))}
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedVehicleTypes.map(([vehicleType, rules]) => (
              <tr key={vehicleType}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {vehicleType}
                </td>
                {ruleFields.map((field) => (
                  <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {rules[field] !== undefined ? rules[field] : 'N/A'}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleOpenModal(vehicleType, rules)}
                    className="text-[#1A4D2E] hover:text-green-700 font-semibold"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
             {sortedVehicleTypes.length === 0 && (
              <tr>
                <td colSpan={ruleFields.length + 2} className="px-6 py-4 text-center text-gray-500">
                  No pricing rules found or data is loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Global Save Button - if needed */}
      <div className="text-center mt-8">
        <button
          onClick={handleGlobalSave}
          disabled={isSaving || Object.keys(editingData).length === 0}
          className="px-8 py-3 bg-[#1A4D2E] cursor-pointer text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving All...' : 'Save All Changes to Firestore'}
        </button>
        <p className="text-xs text-gray-500 mt-2">
            Note: Editing a row and clicking "Save Changes" in the modal saves that specific rule immediately.
            This button saves all current data, useful if you intend to make offline changes (not typical here) or as a redundant save.
        </p>
      </div>


      {/* Modal */}
      {isModalOpen && currentItemForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleCloseModal} // Optional: close modal on backdrop click
          ></div>

          {/* Modal Content */}
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg z-10 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-[#1A4D2E]">
                Edit: {currentItemForEdit.vehicleType}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="space-y-4">
              {Object.entries(modalEditingData)
                .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Sort fields alphabetically
                .map(([field, value]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="number"
                    step="any" // Allows decimals
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={value}
                    onChange={(e) => handleModalInputChange(field, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={isSaving}
                className="px-6 py-2 bg-[#1A4D2E] text-white font-semibold rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingRulesManager;