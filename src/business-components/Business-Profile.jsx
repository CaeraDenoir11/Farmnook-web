import "../index.css";
import profilePic from "../assets/images/profile.png";

export default function BusinessProfile() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-white p-6 md:p-10">
      {/* Card Container */}
      <div className="rounded-3xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col relative">
        {/* Top Section - Dark Green */}
        <div className="relative bg-[#1A4D2E] h-48 md:h-56 w-full flex items-center pl-6 md:pl-12 pt-6">
          <div className="ml-auto pr-6 md:pr-12 text-right pt-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              Caera Denoir
            </h1>
            <p className="text-lg font-medium text-white">Business Admin</p>
          </div>
          <img
            src={profilePic}
            alt="Admin"
            className="absolute left-6 md:left-12 bottom-[-50px] w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white shadow-lg"
          />
        </div>

        {/* Bottom Section - Dirty White (Extends Upwards) */}
        <div className="pt-24 pb-10 px-6 md:px-12 flex flex-col items-start text-left bg-[#F5EFE6] rounded-t-3xl shadow-md w-full -mt-20">
          {/* Admin Details */}
          <div className="mt-6 p-6 md:p-8 w-full ">
            <h2 className="text-2xl font-semibold mb-4 text-[#1A4D2E]">
              Admin Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-600">
                  Full Name
                </span>
                <span className="text-lg font-semibold text-[#1A4D2E]">
                  Caera Denoir
                </span>
              </div>
              <div className="flex flex-col items-start break-words">
                <span className="text-sm font-medium text-gray-600">Email</span>
                <span className="text-lg font-semibold text-[#1A4D2E]">
                  caera.denoir@example.com
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-600">Phone</span>
                <span className="text-lg font-semibold text-[#1A4D2E]">
                  +1 234 567 890
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-gray-600">
                  Date of Birth
                </span>
                <span className="text-lg font-semibold text-[#1A4D2E]">
                  Jan 1, 1990
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
