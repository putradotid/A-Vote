export const useCandidates = () => {
  const { loading, error, fetchCandidates } = useVoterElection()
  return {
    loading,
    error,
    fetchCandidates,
  }
}
