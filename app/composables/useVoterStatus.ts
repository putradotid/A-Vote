export const useVoterStatus = () => {
  const { loading, error, fetchElection } = useVoterElection()

  const checkStatus = async (electionId: string) => {
    const election = await fetchElection(electionId)
    return {
      isRegistered: election?.isRegistered ?? false,
      hasVoted: election?.hasVoted ?? false,
      computedState: election?.computedState ?? null,
    }
  }

  return {
    loading,
    error,
    checkStatus,
  }
}
