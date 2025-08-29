import React from "react";
import { Cpu, Plus, ArrowRight } from "lucide-react";

export const HomePage: React.FC = () => {
	const handleCreateWorkflow = () => {
		window.location.href = "/flow";
	};

	return (
		<div className="min-h-screen bg-white">
			<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
				{/* Header */}
				<div className="text-center mb-16">
					<Cpu className="h-12 w-12 text-gray-800 mx-auto mb-6" />
					<h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-4">
						Helix
					</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto">
						Design AI agent workflows with visual diagrams. Create, connect, and
						orchestrate intelligent systems.
					</p>
				</div>

				{/* Main Action */}
				<div className="text-center mb-12">
					<button
						onClick={handleCreateWorkflow}
						className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-full text-white bg-gray-900 hover:bg-gray-800 transition-colors"
					>
						Create New Workflow
						<ArrowRight className="ml-2 h-5 w-5" />
					</button>
				</div>

				{/* Saved Workflows Section */}
				<div className="border-t border-gray-200 pt-12">
					<div className="text-center mb-8">
						<h2 className="text-2xl font-semibold text-gray-900 mb-2">
							Recent Workflows
						</h2>
						<p className="text-gray-600">Your saved AI workflows</p>
					</div>

					{/* Workflows Grid */}
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{/* Example workflow card */}
						<div className="group relative bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors cursor-pointer">
							<div className="flex items-center justify-between mb-3">
								<Cpu className="h-6 w-6 text-gray-600" />
								<span className="text-xs text-gray-500">2 days ago</span>
							</div>
							<h3 className="font-medium text-gray-900 mb-2">
								Assassin's Creed Brotherhood
							</h3>
							<p className="text-sm text-gray-600 mb-3">
								Multi-agent workflow with Ezio, Altaïr, and team coordination
							</p>
							<div className="flex items-center text-xs text-gray-500">
								<span>11 nodes</span>
								<span className="mx-2">•</span>
								<span>4 agents</span>
								<span className="mx-2">•</span>
								<span>3 skills</span>
							</div>
						</div>

						{/* Empty state for new users */}
						<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
							<Plus className="h-8 w-8 text-gray-400 mx-auto mb-3" />
							<p className="text-sm text-gray-600 mb-2">No workflows yet</p>
							<button
								onClick={handleCreateWorkflow}
								className="text-sm text-gray-900 font-medium hover:text-gray-700"
							>
								Create your first workflow
							</button>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-20 pt-8 border-t border-gray-200">
					<div className="text-center text-sm text-gray-500">
						Powered by Phoenix Framework
					</div>
				</div>
			</div>
		</div>
	);
};
