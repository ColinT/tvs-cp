# 1. Prerequisites

The build scripts for the program designed to run on a **64-bit machine**. If you have a 32-bit machine you must run your own compilation instructions for the various node dependencies. In particular, `memoryjs` must be rebuilt using the `build32` script.

**On all machines**, you will need to compile dependency binaries suitable for your operating environment. This will require:
 - Python 2.7.x or Python 3.7.x
 - Visual Studio 2017 or newer with the "Desktop development with C++ workload"

These resources must be available on your `PATH` for the compilation scripts to find and use them.

# 2. Setup

This is a NodeJS project. The latest supported version is **10.x**. [Download NodeJS 10.x here](https://nodejs.org/dist/latest-v10.x/). You must select the correct binary for your system.

After installing NodeJS, open the project directory in a terminal and install the dependencies:
```
npm install
```

Then build the project:
```
npm run build
```

Start the project with:
```
npm start
```

Build the binaries with:
```
npm run package
```