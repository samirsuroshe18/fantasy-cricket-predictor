import React, { useState } from "react";
import { FaUser } from "react-icons/fa";
import Modal from "react-modal";
import {
    Drawer,
    DrawerPortal,
    DrawerOverlay,
    DrawerTrigger,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerFooter,
    DrawerTitle,
    DrawerDescription,
} from "../components/ui/drawer"

import { Button, buttonVariants } from "../components/ui/button"

Modal.setAppElement("#root");

const Team = () => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);

    const players = [
        { id: 1, name: "Player 1", role: "Batsman", stats: "Average: 50, SR: 140" },
        { id: 2, name: "Player 2", role: "Bowler", stats: "Wickets: 20, Economy: 6.5" },
        { id: 3, name: "Player 3", role: "All-Rounder", stats: "Runs: 300, Wickets: 10" },
        { id: 4, name: "Player 4", role: "Batsman", stats: "Average: 45, SR: 130" },
        { id: 5, name: "Player 5", role: "Bowler", stats: "Wickets: 18, Economy: 7.0" },
        { id: 6, name: "Player 6", role: "Wicketkeeper", stats: "Dismissals: 15, Runs: 250" },
        { id: 7, name: "Player 7", role: "Batsman", stats: "Average: 55, SR: 145" },
        { id: 8, name: "Player 8", role: "Bowler", stats: "Wickets: 25, Economy: 6.2" },
        { id: 9, name: "Player 9", role: "All-Rounder", stats: "Runs: 400, Wickets: 15" },
        { id: 10, name: "Player 10", role: "Batsman", stats: "Average: 48, SR: 135" },
        { id: 11, name: "Player 11", role: "Bowler", stats: "Wickets: 22, Economy: 6.8" },
    ];


    const openModal = (player) => {
        setSelectedPlayer(player);
        setModalIsOpen(true);
    };

    const closeModal = () => {
        setModalIsOpen(false);
        setSelectedPlayer(null);
    };

    return (
        <div className="font-sans bg-gray-50 min-h-screen">
            <header className="bg-emerald-500 text-white py-4">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl font-bold">AI Predicted Team</h1>
                </div>
            </header>

            <main className="py-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-semibold mb-6">Your Team</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className="bg-white p-4 rounded shadow text-center flex flex-col justify-between"
                            >
                                <div>
                                    <h3 className="text-xl font-bold mb-2">{player.name}</h3>
                                    <p className="text-gray-600 mb-4">{player.role}</p>
                                </div>
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <button
                                            onClick={() => openModal(player)}
                                            className="bg-emerald-500 text-white font-semibold py-2 px-4 rounded hover:bg-emerald-600"
                                        >
                                            See Details
                                        </button>
                                    </DrawerTrigger>
                                    {selectedPlayer && selectedPlayer.id === player.id && (
                                        <DrawerContent>
                                            <DrawerHeader>
                                                <DrawerTitle>{selectedPlayer.name}</DrawerTitle>
                                                <DrawerDescription>
                                                    <strong>Role:</strong> {selectedPlayer.role}
                                                    <br />
                                                    <strong>Stats:</strong> {selectedPlayer.stats}
                                                </DrawerDescription>
                                            </DrawerHeader>
                                            <DrawerFooter>
                                                <Button>Submit</Button>
                                                <DrawerClose asChild>
                                                    <Button variant="outline" onClick={closeModal}>Cancel</Button>
                                                </DrawerClose>
                                            </DrawerFooter>
                                        </DrawerContent>
                                    )}
                                </Drawer>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {selectedPlayer && (
                <Drawer isOpen={modalIsOpen} onClose={closeModal}>
                    <DrawerOverlay />
                    <DrawerPortal>
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>{selectedPlayer.name}</DrawerTitle>
                                <DrawerDescription>
                                    <strong>Role:</strong> {selectedPlayer.role}
                                    <br />
                                    <strong>Stats:</strong> {selectedPlayer.stats}
                                </DrawerDescription>
                            </DrawerHeader>
                            <DrawerFooter>
                                <Button>Submit</Button>
                                <DrawerClose asChild>
                                    <Button variant="outline" onClick={closeModal}>Cancel</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </DrawerPortal>
                </Drawer>
            )}


            <footer className="text-center py-6 bg-gray-900 text-gray-400">
                <p>&copy; 2025 Fantasy Cricket Predictor. All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default Team;