# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Makefile                                           :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: dande-je <dande-je@student.42sp.org.br>    +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2026/03/15 16:03:26 by dande-je          #+#    #+#              #
#    Updated: 2026/03/16 02:39:03 by dande-je         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

#******************************************************************************#
#                                   COLOR                                      #
#******************************************************************************#
 
COLOR_RESET  = \033[0m
COLOR_GREEN  = \033[32m
COLOR_YELLOW = \033[33m
COLOR_RED    = \033[31m
COLOR_BLUE   = \033[34m
 
#******************************************************************************#
#                                PROJECT VARS                                  #
#******************************************************************************#
 
COMPOSE_PATH  :=
COMPOSE_FILE  ?= $(COMPOSE_PATH)docker-compose.yml
PROJECT_NAME  ?= ft_transcendece
 
REQUIRED_VARS := DB_PASSWORD DATABASE_URL NEXTAUTH_SECRET RESET_PASSWORD_SECRET
 
#******************************************************************************#
#                              DOCKER COMMANDS                                 #
#******************************************************************************#
 
COMPOSE    = docker compose --project-name $(PROJECT_NAME) -f $(COMPOSE_FILE)
COMPOSE_V1 = docker-compose --project-name $(PROJECT_NAME) -f $(COMPOSE_FILE)
ifeq ($(shell command -v docker compose >/dev/null 2>&1; echo $$?), 1)
	COMPOSE = $(COMPOSE_V1)
endif
 
#******************************************************************************#
#                                   TARGETS                                    #
#******************************************************************************#
 
all: up
 
env-check:
	@if [ ! -f $(COMPOSE_PATH).env ]; then \
		echo "$(COLOR_RED)Error: .env missing. Run: cp .env.example .env && fill in values.$(COLOR_RESET)"; \
		exit 1; \
	fi
	@for var in $(REQUIRED_VARS); do \
		val=$$(grep -E "^$$var=" $(COMPOSE_PATH).env | cut -d'=' -f2- | tr -d '"' | xargs); \
		if [ -z "$$val" ]; then \
			echo "$(COLOR_RED)Error: $$var is not set in .env$(COLOR_RESET)"; \
			exit 1; \
		fi; \
	done
	@echo "$(COLOR_GREEN)✓ .env validated.$(COLOR_RESET)"
 
up: env-check
	$(COMPOSE) up -d
	@echo "$(COLOR_GREEN)✓ Infrastructure up at http://localhost:3000$(COLOR_RESET)"
 
build:
	$(COMPOSE) build --parallel --no-cache --pull
 
down:
	$(COMPOSE) down --remove-orphans --timeout 30
	docker container prune -f
	@echo "$(COLOR_YELLOW)Containers down; volumes intact.$(COLOR_RESET)"
 
clean: down
	$(COMPOSE) down --rmi local --volumes --remove-orphans --timeout 30
	$(COMPOSE) down
	docker system prune -f --filter label=project=$(PROJECT_NAME)
	@echo "$(COLOR_YELLOW)Cleaned (volumes preserved).$(COLOR_RESET)"
 
fclean: clean
	$(eval VOLS := $(shell docker volume ls -q -f "name=sqlserver_data" 2>/dev/null || true))
	@if [ -n "$(VOLS)" ]; then \
		echo "$(COLOR_YELLOW)Removing Docker volumes: $(VOLS)$(COLOR_RESET)"; \
		docker volume rm -f $(VOLS) || true; \
	else \
		echo "$(COLOR_YELLOW)No Docker volumes to remove.$(COLOR_RESET)"; \
	fi
	docker network prune -f
	docker system prune --all --volumes --force
	@echo "$(COLOR_RED)Full clean complete.$(COLOR_RESET)"
 
re: fclean up
 
logs:
	$(COMPOSE) logs -f --tail=100
 
logs-%:
	$(COMPOSE) logs -f --tail=100 $*
 
validate:
	$(COMPOSE) config --quiet
	$(COMPOSE) ps | grep -q healthy || (echo "$(COLOR_RED)Healthcheck failed!$(COLOR_RESET)" && exit 1)
	@echo "$(COLOR_GREEN)Validation passed.$(COLOR_RESET)"
 
help:
	@echo "$(COLOR_BLUE)Available targets:$(COLOR_RESET)"
	@echo "  $(COLOR_GREEN)up$(COLOR_RESET)        Build and start all containers"
	@echo "  $(COLOR_GREEN)down$(COLOR_RESET)      Stop containers, preserve volumes"
	@echo "  $(COLOR_GREEN)clean$(COLOR_RESET)     Stop and remove containers + local images"
	@echo "  $(COLOR_GREEN)fclean$(COLOR_RESET)    Full clean including Docker volumes"
	@echo "  $(COLOR_GREEN)re$(COLOR_RESET)        Full clean then start fresh"
	@echo "  $(COLOR_GREEN)logs$(COLOR_RESET)      Tail logs for all services"
	@echo "  $(COLOR_GREEN)logs-app$(COLOR_RESET)  Tail logs for a specific service (e.g. logs-app, logs-sqlserver)"
	@echo "  $(COLOR_GREEN)validate$(COLOR_RESET)  Validate compose config and healthchecks"
 
.PHONY: all up down clean fclean re logs validate env-check help
.DEFAULT_GOAL := all
.SILENT:
.NOTPARALLEL:
