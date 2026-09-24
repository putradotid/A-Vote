export const useElection = () => {
  const { loading, error, fetchElections, fetchElection } = useVoterElection()
  return {
    loading,
    error,
    fetchElections,
    fetchElection,
  }
}
