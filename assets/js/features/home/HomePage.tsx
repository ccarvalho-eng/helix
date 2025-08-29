import React from "react";
import { Cpu, Plus, ArrowRight } from "lucide-react";
import { ThemeToggle } from "../flow-builder/components/ThemeToggle";

export const HomePage: React.FC = () => {
	const handleCreateWorkflow = () => {
		window.location.href = "/flow";
	};

	return (
		<div className="home-page">
			{/* Theme Toggle */}
			<div className="home-theme-toggle">
				<ThemeToggle />
			</div>

			<div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
				{/* Header */}
				<div className="home-header">
					<Cpu className="home-header__icon" />
					<h1 className="home-header__title">Helix</h1>
					<p className="home-header__subtitle">
						Design AI agent workflows with visual diagrams. Create, connect, and
						orchestrate intelligent systems.
					</p>
				</div>

				{/* Main Action */}
				<div className="home-main-action">
					<button onClick={handleCreateWorkflow} className="home-create-btn">
						Create New Workflow
						<ArrowRight />
					</button>
				</div>

				{/* Saved Workflows Section */}
				<div className="home-workflows">
					<div className="home-workflows__header">
						<h2 className="home-workflows__title">Recent Workflows</h2>
						<p className="home-workflows__subtitle">Your saved AI workflows</p>
					</div>

					{/* Workflows Grid */}
					<div className="home-workflows__grid">
						{/* Example workflow card */}
						<div className="home-workflow-card">
							<div className="home-workflow-card__header">
								<Cpu className="home-workflow-card__icon" />
								<span className="home-workflow-card__date">2 days ago</span>
							</div>
							<h3 className="home-workflow-card__title">Assassin's Creed</h3>
							<p className="home-workflow-card__description">
								Multi-agent workflow with Ezio, Altaïr, and team coordination
							</p>
							<div className="home-workflow-card__stats">
								<span>11 nodes</span>
								<span>4 agents</span>
								<span>3 skills</span>
							</div>
						</div>

						{/* Empty state for new users */}
						<div className="home-empty-card">
							<Plus className="home-empty-card__icon" />
							<p className="home-empty-card__text">No workflows yet</p>
							<button
								onClick={handleCreateWorkflow}
								className="home-empty-card__button"
							>
								Create your first workflow
							</button>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="home-footer">
					<div className="home-footer__text">Powered by Phoenix Framework</div>
				</div>
			</div>
		</div>
	);
};
