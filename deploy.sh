#Run this script to update @configcat/sdk to the latest and release a new version of @configcat/sdk
set -e #Making sure script stops on error
npm test
git push origin $(npm version patch)
git push