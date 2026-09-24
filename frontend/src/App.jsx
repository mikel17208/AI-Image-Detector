import { useState } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
  };

  const detectImage = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/detect",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Detection failed");
      }

      setResult(data);
    } catch (error) {
      setResult({
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDetector = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AI Image Detector
            </h1>
            <p className="text-sm text-slate-400">
              Detect whether an image may be AI-generated
            </p>
          </div>

          <div className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300">
            AI Detection
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <section className="mb-12 text-center">
          <p className="mb-3 text-sm font-medium text-blue-400">
            IMAGE ANALYSIS
          </p>

          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            Is this image
            <span className="text-blue-400"> AI-generated?</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-400">
            Upload an image and our detector will analyze it and provide an
            estimated AI-generated probability.
          </p>
        </section>

        {/* Upload / Preview */}
        <section className="mx-auto max-w-3xl">
          {!preview ? (
            <label className="group flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 px-6 transition hover:border-blue-500 hover:bg-slate-900">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-3xl transition group-hover:bg-blue-500/10">
                📁
              </div>

              <h3 className="text-lg font-semibold">
                Upload an image
              </h3>

              <p className="mt-2 text-sm text-slate-400">
                Click to browse your files
              </p>

              <p className="mt-4 text-xs text-slate-500">
                JPG, PNG, JPEG, or JFIF
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
              {/* Image */}
              <div className="flex justify-center bg-slate-950 p-6">
                <img
                  src={preview}
                  alt="Selected image"
                  className="max-h-[450px] max-w-full rounded-2xl object-contain"
                />
              </div>

              {/* File information */}
              <div className="border-t border-slate-800 p-6">
                <p className="truncate text-sm font-medium">
                  {file.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Ready for analysis
                </p>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={detectImage}
                    disabled={loading}
                    className="flex-1 rounded-xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Analyzing..." : "Analyze Image"}
                  </button>

                  <button
                    onClick={resetDetector}
                    disabled={loading}
                    className="rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Loading */}
        {loading && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-blue-400" />

            <p className="font-medium">
              Analyzing your image...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              This may take a few seconds.
            </p>
          </div>
        )}

        {/* Result */}
        {result && !result.error && !loading && (
          <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <div className="mb-8 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-slate-500">
                Detection Result
              </p>

              <div className="mt-4 text-6xl font-bold">
                {result.ai_percentage}%
              </div>

              <p className="mt-2 text-slate-400">
                AI-generated probability
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 text-center">
              <p className="text-xs uppercase tracking-widest text-slate-500">
                Verdict
              </p>

              <p className="mt-2 text-xl font-semibold">
                {result.verdict}
              </p>
            </div>

            <div className="mt-5 text-center">
              <p className="truncate text-sm text-slate-500">
                {result.filename}
              </p>
            </div>

            <button
              onClick={resetDetector}
              className="mt-6 w-full rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-300 transition hover:bg-slate-800"
            >
              Analyze Another Image
            </button>
          </section>
        )}

        {/* Error */}
        {result?.error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-900/50 bg-red-950/30 p-5 text-center">
            <p className="font-medium text-red-400">
              {result.error}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        AI Image Detector • Image analysis powered by Sightengine
      </footer>
    </div>
  );
}

export default App;