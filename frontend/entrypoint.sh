#!/bin/sh
if [ -n "$VITE_API_URL" ]; then
  echo "Injecting runtime VITE_API_URL: $VITE_API_URL"
  find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|http://localhost:5000|$VITE_API_URL|g" {} +
fi
