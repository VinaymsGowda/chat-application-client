# ------------ Stage 1: Build the Vite React app -------------
FROM node:alpine AS build

WORKDIR /app
    
# Install dependencies
COPY package.json package-lock.json ./
RUN npm install
    
# Copy all code
COPY . .
    
# Build Vite
RUN npm run build
    
    
# ------------ Stage 2: Minimal final image ------------------
FROM nginx:alpine
    
# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy dist output from builder
COPY --from=build /app/dist /usr/share/nginx/html
    
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]