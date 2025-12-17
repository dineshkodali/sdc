# from project root
npm install                # installs root deps (concurrently etc.)

# then install backend deps
cd Backend
npm install

# then install frontend deps (this is the important one for vite)
cd ../frontend
npm install
