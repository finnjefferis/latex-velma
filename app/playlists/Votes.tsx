"use client";

import { useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";

type Vote = {
  spotifytrackid: string;
  spotifyuserid: string;
  profilePicture?: string | null;
  votedat: string;
};

type VotesProps = {
  votes: Vote[];
  trackId: string;
};

function VotesDisplay({ votes, trackId, onClick }: VotesProps & { onClick: () => void }) {
  const filteredVotes = votes.filter((vote) => vote.spotifytrackid === trackId);

  return (
    <div
      className="relative flex items-center cursor-pointer"
      onClick={(e) => {
        e.stopPropagation(); // Prevent parent `onClick` from triggering
        onClick();
      }}
    >
      {filteredVotes.slice(0, 3).map((vote, idx) => (
        <div
          key={`${vote.spotifyuserid}-${idx}`}
          className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-900 -ml-3 first:ml-0"
        >
          {vote.profilePicture ? (
            <Image
              src={vote.profilePicture}
              alt={vote.spotifyuserid}
              width={32}
              height={32}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
              {vote.spotifyuserid[0]?.toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {filteredVotes.length > 3 && (
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white font-bold -ml-3">
          +{filteredVotes.length - 3}
        </div>
      )}
    </div>
  );
}

function VotesModal({ isOpen, votes, trackId, onClose }: VotesProps & { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const filteredVotes = votes.filter((vote) => vote.spotifytrackid === trackId);

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from bubbling up
    >
      <div className="bg-gray-900 text-white rounded-md p-6 max-w-md w-full relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Votes</h2>
        <ul>
          {filteredVotes.map((vote, idx) => (
            <li key={`${vote.spotifyuserid}-${idx}`} className="flex items-center gap-4 mb-2">
              {vote.profilePicture ? (
                <Image
                  src={vote.profilePicture}
                  alt={vote.spotifyuserid}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-bold">
                  {vote.spotifyuserid[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium">{vote.spotifyuserid}</p>
                <p className="text-sm text-gray-400">{new Date(vote.votedat).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}

export default function Votes({ votes, trackId }: VotesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    console.log("Opening modal...");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log("Closing modal...");
    setIsModalOpen(false);
  };

  return (
    <div>
      <VotesDisplay votes={votes} trackId={trackId} onClick={openModal} />
      <VotesModal isOpen={isModalOpen} votes={votes} trackId={trackId} onClose={closeModal} />
    </div>
  );
}
