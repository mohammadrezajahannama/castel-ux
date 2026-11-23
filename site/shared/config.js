/* Site settings shared by every test page. */

// The admin's Bale ID that testers send the result file to when automatic sending fails, e.g. "@castel_ux".
// Empty: "the person who sent you the link".
window.UX_CONTACT = "";

// The private repo that receives results as issues (see ux-submit.js).
window.UX_RESULTS_REPO = "mohammadrezajahannama/castel-ux-results";

// The admin's public key (made in the admin panel). Results are encrypted with it. null: automatic sending is off.
window.UX_PUBLIC_KEY = {"kty": "RSA", "n": "ozmfFJhNBJuNPgf_hilkLhdknZG18OQnW7b72ncGLgfCCa1eOqlybZ6nAwSpB18t_ExVA7zGw3mfhJkEVhGvpC1Uylu4ecphn9tBk8awvPHCDSWTFCORIUUgXiPaAEqfEynFkXgq6zFnfeBFuRUc1mvR3FvE74m-Axhm1X1kT2VJsLreylaVTDLL0dIipM00f2sB-CSZZLLz32ov1tjHZARIaYSy_NQrwpA_0ja-o1uRC706mxyVW-Mz6RZooLbE9-Ilf7Mfo4vkdBXkKWvXA3wLpseJ09Yc8KhzNQQ_Slj9j3C6DJ0AsPVf99UHJ8WBV_FHWLiCg6cSNjiUDE-A8l6lPRnentHHruTZEeqL9undIHqjx6qcMfC97sSX9JZxF0DnjUAh99HlvD1Vi1NjLB6sDHc3Gxv9jxhCwAv-zRNdRUWBDtRrLbIMrIT-UcNDsni7ruq6S3Z16EJb0I4_oHQAX-zL8cfkjAvrmeby3pVoqwXQbSKrV-t3B337ksaV", "e": "AQAB", "alg": "RSA-OAEP-256", "kid": "ozNUCw", "ext": true, "key_ops": ["encrypt"]};
